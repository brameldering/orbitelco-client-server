import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { IExtendedRequest } from 'types/commonTypes';
import {
  IdSequenceObject,
  ProductObject,
  OrderDocument,
  OrderOrderItem,
} from 'types/mongoose.gen';

import IdSequence from '../general/models/idSequenceModel';
import { calcPrices } from '../general/utils/calcPrices';
import {
  verifyPayPalPayment,
  checkIfNewTransaction,
} from '../general/utils/paypal';
import asyncHandler from '../middleware/asyncHandler';
import { ExtendedError } from '../middleware/errorMiddleware';
import Product from '../product/productModel';

import Order from './orderModel';



// @desc    Get all orders
// @route   GET /api/orders/v1
// @access  Private/Admin
// @req
// @res     status(200).json(orders)
const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({}).populate('user', 'name email').exec();
  res.status(200).json(orders);
});

// @desc    Create new order
// @route   POST /api/orders/v1
// @access  Private
// @req     user._id
//          body {orderItems, shippingAddress, paymentMethod}
// @res     status(201).json(createdOrder)
//       or status(400).message:'No order items'
const createOrder = asyncHandler(
  async (req: IExtendedRequest, res: Response) => {
    const { orderItems, shippingAddress, paymentMethod } = req.body;
    console.log('=== createOrder');
    if (orderItems && orderItems.length === 0) {
      throw new ExtendedError('No order items', 400);
    } else {
      // get the product info for the orderItems from the database
      const itemsFromDB: ProductObject[] = await Product.find({
        _id: { $in: orderItems.map((x: OrderOrderItem) => x.productId) },
      });
      console.log('itemsFromDB');
      console.log(itemsFromDB);
      // map over the order items and get the price from our items from database
      const dbOrderItems: OrderOrderItem[] = orderItems.map(
        (itemFromClient: OrderOrderItem) => {
          const matchingItemFromDB: ProductObject | undefined =
            itemsFromDB.find(
              (itemFromDB) =>
                itemFromDB._id.toString() ===
                itemFromClient.productId.toString()
            );
          return {
            ...itemFromClient,
            productId: itemFromClient.productId,
            price: matchingItemFromDB!.price,
            _id: undefined,
          };
        }
      );
      console.log('dbOrderItems');
      console.log(dbOrderItems);
      // calculate prices
      const totalAmounts = calcPrices(dbOrderItems);
      console.log('= createOrder.calcPrices ================');
      console.log(totalAmounts);
      // console.time('TimeNeededToSaveOrder');
      // Determine next orderId
      const seqNumberOrderId: IdSequenceObject =
        await IdSequence.findOneAndUpdate(
          { sequenceName: 'sequenceOrderId' },
          { $inc: { sequenceCounter: 1 } },
          { returnOriginal: false, upsert: true }
        );
      const sequenceOrderId: string =
        'ORD-' + seqNumberOrderId.sequenceCounter.toString().padStart(10, '0');
      if (!(req.user && req.user._id)) {
        throw new ExtendedError('No user has been passed to this request.');
      }
      const order: OrderDocument = new Order({
        sequenceOrderId: sequenceOrderId,
        orderItems: dbOrderItems,
        userId: req.user._id,
        shippingAddress,
        paymentMethod,
        totalAmounts,
      });
      const createdOrder = await order.save();
      // console.timeEnd('TimeNeededToSaveOrder');
      res.status(201).json(createdOrder);
    }
  }
);

// @desc    Get logged in user orders
// @route   GET /api/orders/v1/mine/:id
// @access  Private
// @req     params.id
// @res     status(200).json(orders)
const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = new mongoose.Types.ObjectId(req.params.id);
  const orders = await Order.find({ userId: userId });
  res.status(200).json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/v1/:id
// @access  Private
// @req     params.id
// @res     status(200).json(order)
//       or status(404).message:'Order not found'
const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .exec();

  // console.log('= getOrderById ==============================');
  // console.log(order);
  // console.log('=============================================');
  if (order) {
    res.status(200).json(order);
  } else {
    throw new ExtendedError('Order not found', 404);
  }
});

// @desc    Update order to paid
// @route   PUT /api/orders/v1/:id/pay
// @access  Private
// @req     params.id
//          body {id, status, update_time, payer.email_address}
// @res     status(200).json(updatedOrder)
//       or status(404).message:'Order not found'
const updateOrderToPaid = asyncHandler(async (req: Request, res: Response) => {
  // NOTE: here we need to verify the payment was made to PayPal before marking
  // the order as paid
  console.log('= updateOrderToPaid ==============================');
  const { verified, value } = await verifyPayPalPayment(req.body.id);
  if (!verified) throw new ExtendedError('Payment not verified');
  // check if this transaction has been used before
  const isNewTransaction = await checkIfNewTransaction(Order, req.body.id);
  if (!isNewTransaction) {
    throw new ExtendedError('Transaction has been used before');
  }
  const order = await Order.findById(req.params.id);
  if (order && order.totalAmounts) {
    // check the correct amount was paid
    const paidCorrectAmount = order.totalAmounts.totalPrice === Number(value);
    if (!paidCorrectAmount) throw new ExtendedError('Incorrect amount paid');
    order.isPaid = true;
    order.paidAt = new Date(Date.now());
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };
    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } else {
    throw new ExtendedError('Order not found', 404);
  }
});

// @desc    Update order to delivered
// @route   PUT /api/orders/v1/:id/deliver
// @access  Private/Admin
// @req     params.id
// @res     status(200).json(updatedOrder)
//       or status(404).message:'Order not found'
const updateOrderToDelivered = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDelivered = true;
      order.deliveredAt = new Date(Date.now());
      const updatedOrder = await order.save();
      res.status(200).json(updatedOrder);
    } else {
      throw new ExtendedError('Order not found', 404);
    }
  }
);

// @desc    Calculate total prices for cart or order items
// @route   POST /api/orders/v1/totals
// @access  Public
// @req     body {items}
// @res     status(200).json(totalAmounts)
//       or status(404).message:'Order not found'
const calcTotalAmounts = asyncHandler(async (req: Request, res: Response) => {
  const { cartItems } = req.body;
  // console.log('= calcTotalPrices ==============================');
  // console.log(cartItems);

  const totalAmounts = calcPrices(cartItems);
  // console.log(totalAmounts);
  // console.log('================================================');

  res.status(200).json({
    totalAmounts,
  });
});

export {
  getOrders,
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  calcTotalAmounts,
};