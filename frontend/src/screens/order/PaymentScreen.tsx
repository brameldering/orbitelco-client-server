import React, { useState, useEffect } from 'react';
import { Form, Button, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import FormContainer from '../../components/form/FormContainer';
import Meta from '../../components/general/Meta';
import CheckoutSteps from '../../components/order/CheckoutSteps';
import { savePaymentMethod } from '../../slices/cartSlice';
import type { RootState } from '../../store';

const PaymentScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cart = useSelector((state: RootState) => state.cart);
  const { shippingAddress } = cart;

  /* If shippingAddress has not yet been filled then redirect */
  useEffect(() => {
    if (!shippingAddress.address) {
      navigate('/shipping');
    }
  }, [navigate, shippingAddress]);

  const [paymentMethod, setPaymentMethod] = useState('PayPal');

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(savePaymentMethod(paymentMethod));
    navigate('/placeorder');
  };

  return (
    <>
      <Meta title='Payment Method' />
      <CheckoutSteps currentStep={2} />
      <FormContainer>
        <h1>Payment Method</h1>
        <Form onSubmit={submitHandler}>
          <Form.Group>
            <Form.Label as='legend'>Select Method</Form.Label>
            <Col>
              <Form.Check
                className='my-2'
                type='radio'
                label='PayPal or Credit Card'
                id='PayPal'
                name='paymentMethod'
                value='PayPal'
                checked
                onChange={(e) => setPaymentMethod(e.target.value)}></Form.Check>
            </Col>
          </Form.Group>
          <Button id='BUTTON_continue' type='submit' variant='primary mt-2'>
            Continue
          </Button>
        </Form>
      </FormContainer>
    </>
  );
};

export default PaymentScreen;
