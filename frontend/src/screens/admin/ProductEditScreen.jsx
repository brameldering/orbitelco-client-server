import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { textField, numField } from '../../components/form/ValidationSpecs';
import FormContainer from '../../components/form/FormContainer';
import {
  TextField,
  NumberField,
  // HiddenTextField,
} from '../../components/form/FormComponents';
import Meta from '../../components/general/Meta';
import Loader from '../../components/general/Loader';
import { ErrorMessage } from '../../components/general/Messages';
import ModalConfirmBox from '../../components/general/ModalConfirmBox';
import {
  useGetProductDetailsQuery,
  useUpdateProductMutation,
  useUploadProductImageMutation,
} from '../../slices/productsApiSlice';

const ProductEditScreen = () => {
  const navigate = useNavigate();
  const { id: productId } = useParams();

  const {
    data: product,
    isLoading,
    refetch,
    error: errorLoading,
  } = useGetProductDetailsQuery(productId);

  const [updateProduct, { isLoading: performingUpdate, error: errorUpdating }] =
    useUpdateProductMutation();

  const [
    uploadProductImage,
    { isLoading: performinUploadImage, error: errorUploadImage },
  ] = useUploadProductImageMutation();

  const formik = useFormik({
    initialValues: {
      productIdSeq: product?.sequenceProductId || null,
      name: product?.name || '',
      price: product?.price || 0,
      image: product?.image || '',
      brand: product?.brand || '',
      category: product?.category || '',
      countInStock: product?.countInStock || 0,
      description: product?.description || '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: textField().required('required'),
      price: numField().required('required'),
      image: textField(),
      brand: textField(),
      category: textField(),
      countInStock: numField().required('required'),
      description: textField(),
    }),
    onSubmit: async (values) => {
      const productIdSeq = values.productIdSeq;
      const name = values.name;
      const price = values.price;
      const image = values.image;
      const brand = values.brand;
      const category = values.category;
      const countInStock = values.countInStock;
      const description = values.description;
      try {
        await updateProduct({
          productId,
          productIdSeq,
          name,
          price,
          image,
          brand,
          category,
          countInStock,
          description,
        }).unwrap();
        toast.success('Product updated');
        refetch();
        navigate('/admin/productlist');
      } catch (err) {
        // Do nothing because useUploadProductImageMutation will set errorUploadImage in case of an error
      }
    },
  });

  const uploadFileHandler = async (e) => {
    const formData = new FormData();
    formData.append('image', e.target.files[0]);
    try {
      const res = await uploadProductImage(formData).unwrap();
      formik.setFieldValue('image', res.image);
      toast.success(res.message);
    } catch (err) {
      // Do nothing because useUpdateProductMutation will set errorUpdating in case of an error
    }
  };

  const [showChangesModal, setShowChangesModal] = useState(false);
  const goBackWithoutSaving = () => {
    setShowChangesModal(false);
    navigate('/admin/productlist');
  };
  const cancelGoBack = () => setShowChangesModal(false);
  const goBackHandler = async () => {
    if (formik.dirty) {
      setShowChangesModal(true);
    } else {
      navigate('/admin/productlist');
    }
  };

  const disableSubmit = isLoading || performingUpdate || performinUploadImage;

  return (
    <>
      <Meta title='Edit Product' />
      <ModalConfirmBox
        showModal={showChangesModal}
        title='Discard Changes'
        body='You have made changes that have not yet been saved.  Do you want to go back and discard these changes?'
        handleClose={cancelGoBack}
        handleConfirm={goBackWithoutSaving}
      />
      <Button
        className='btn btn-light my-3'
        onClick={goBackHandler}
        disabled={disableSubmit}>
        Go Back
      </Button>
      <FormContainer>
        <h1>Edit Product</h1>
        {errorUpdating && <ErrorMessage error={errorUpdating} />}
        {errorUploadImage && <ErrorMessage error={errorUploadImage} />}
        {isLoading ? (
          <Loader />
        ) : errorLoading ? (
          <ErrorMessage error={errorLoading} />
        ) : (
          <Form onSubmit={formik.handleSubmit}>
            <p>
              <strong>Product Id: </strong> {product?.sequenceProductId}
            </p>
            <TextField controlId='name' label='Product name' formik={formik} />
            <Form.Group className='my-2' controlId='image'>
              <Form.Label className='my-1'>Image</Form.Label>
              <Row className='align-items-center'>
                <Col md={4}>
                  <img
                    src={formik.values.image}
                    alt='formik.values.name'
                    width='80'
                    height='80'
                  />
                </Col>
                <Col md={8}>
                  <Form.Control
                    name='image'
                    type='text'
                    value={formik.values.image}
                    disabled
                  />
                </Col>
                {/* <HiddenTextField controlId='image' formik={formik} /> */}
              </Row>
              <Form.Control
                label='Choose File'
                onChange={uploadFileHandler}
                type='file'
                className='my-1'></Form.Control>
            </Form.Group>
            {performinUploadImage && <Loader />}
            <TextField controlId='brand' label='Brand' formik={formik} />
            <NumberField controlId='price' label='Price' formik={formik} />
            <NumberField
              controlId='countInStock'
              label='Count In Stock'
              formik={formik}
            />
            <TextField controlId='category' label='Category' formik={formik} />
            <TextField
              controlId='description'
              label='Description'
              formik={formik}
            />
            <Button
              type='submit'
              variant='primary'
              className='mt-2'
              disabled={disableSubmit}>
              Save
            </Button>
            {performingUpdate && <Loader />}
          </Form>
        )}
      </FormContainer>
    </>
  );
};

export default ProductEditScreen;
