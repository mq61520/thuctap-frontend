import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import ReactToPrint from 'react-to-print';

//mui
import Modal from '@mui/material/Modal';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import DriveFileRenameOutlineOutlinedIcon from '@mui/icons-material/DriveFileRenameOutlineOutlined';
import ChangeCircleOutlinedIcon from '@mui/icons-material/ChangeCircleOutlined';
import LocalPrintshopRoundedIcon from '@mui/icons-material/LocalPrintshopRounded';
import CloseIcon from '@mui/icons-material/Close';

//paypal api
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

import styles from './Payment.module.scss';
import currencyFormater from '../../common/formatCurrency';
import { setPayList, setTotal } from '../../app/slices/paySlice';
import { changeAmount } from '../../app/slices/cartSlice';
import Bill from './OrderBill';
import { SearchTwoTone } from '@mui/icons-material';

const cn = classNames.bind(styles);

function Payment() {
   //modal
   const [openModal, setOpenModal] = useState(false);
   const handleOpen = () => setOpenModal(true);
   const handleClose = () => setOpenModal(false);
   const styleModal = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'fit-content',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: 24,
      padding: '20px',
   };

   //choose shipping unit
   const [shipType, setShipType] = useState(50000);
   const handleChange = (event) => {
      setShipType(event.target.value);
   };

   //payment method
   const [payMethod, setPayMethod] = useState({ method: 'COD', status: false });

   //paypal options
   const paypalOptions = {
      'client-id': 'AYyRYx-U9NtmJnlgAdILj9GM9l9GPW9LYRmFoeJ4J9JITKkKq_18zyGjujIxIYpdXyAgEzg8urAL2v2D',
   };

   //selected list product
   const listProd = useSelector((state) => state.pay);
   const dispatch = useDispatch();
   console.log(listProd);

   //get user info
   const [userInfo, setUserInfo] = useState('');
   const handleGetUserInfo = async () => {
      try {
         const user_info_response = await axios.get(
            'http://localhost:4000/account/get/' + localStorage.getItem('user_id'),
         );

         console.log(user_info_response.data);

         if (user_info_response.data) {
            setPhone(user_info_response.data[0].nd_phonenumber);
            setAddress(user_info_response.data[0].nd_address);
            setUserInfo(user_info_response.data[0]);
         }
      } catch (err) {
         console.log(err);
      }
   };

   //update phone & address
   const [phone, setPhone] = useState('');
   const [address, setAddress] = useState('');
   const handleUpdateInfo = async () => {
      if (phone.length <= 0 || address.length <= 0) {
         toast.warn('Nhập đầy đủ thông tin.', { position: 'top-center' });
      } else {
         try {
            const update_res = await axios.post('http://localhost:4000/account/change', {
               phone: phone,
               address: address,
               user_id: localStorage.getItem('user_id'),
            });

            if (update_res.data === 'UpdateSuccess') {
               handleGetUserInfo();
               setOpenModal(false);
               toast.success('Cập nhật thành công.', { position: 'top-center' });
            } else {
               toast.error('Lỗi.', { position: 'top-center' });
            }
         } catch (error) {
            console.log(error);
         }
      }
   };

   //create order
   const [orderStatus, setOrderStatus] = useState(false);
   const [note, setNote] = useState('');
   const cart = useSelector((state) => state.cart);
   const location = useSelector((state) => state.pay);
   //&& payMethod.status === 'Paid'
   const handleOrder = async () => {
      try {
         if (address.length <= 0 || phone.length <= 0 || address === 'undefined' || phone === 'undefined') {
            toast.warn('Cập nhật địa chỉ và số điện thoại.', { position: 'top-center' });
            return;
         } else {
            if (payMethod.method !== 'Paypal' || payMethod.method !== 'COD') {
               const order_res = await axios.post('http://localhost:4000/order/add', {
                  user_id: localStorage.getItem('user_id'),
                  ngay_lap: new Date().toISOString().slice(0, 10),
                  dia_chi: address,
                  sdt: phone,
                  sl_sp: listProd.listProd.length,
                  tong_tien: total + shipType,
                  htgh: shipType === 50000 ? 'Nhanh' : 'Hỏa tốc',
                  httt: payMethod.method,
                  ghi_chu: note,
                  location: location.location,
                  ds_sp: listProd.listProd,
               });

               if (order_res.data === 'InsertSuccess') {
                  // const reset_listpay_action = setPayList();
                  // dispatch(reset_listpay_action);

                  //set total in global state
                  const set_total_action = setTotal(total);
                  dispatch(set_total_action);
                  toast.success('Đặt hàng thành công!', { position: 'top-center' });

                  if (location.location === 'FromCart') {
                     const update_cart_amount_action = changeAmount(cart.amount - listProd.listProd.length);
                     dispatch(update_cart_amount_action);
                  } else if (location.location === 'BuyNow') {
                  }

                  setOrderStatus(true);
                  // handleAddPurchase();
               } else {
                  toast.success('Đặt hàng không thành công!', { position: 'top-center' });
               }
            } else {
               toast.warn('Hãy thanh toán trước.', { position: 'top-center' });
            }
         }
      } catch (error) {
         console.log(error);
      }
   };

   //react-to-print
   let componentRef = useRef();

   //
   var total = 0;

   useEffect(() => {
      handleGetUserInfo();
   }, []);

   return (
      <div className={cn('payment-page')}>
         <div className={cn('inner')}>
            {!orderStatus ? (
               <>
                  <div className={cn('delivery-address')}>
                     <div className={cn('letter')}></div>

                     <h3 className={cn('title')}>
                        <LocationOnOutlinedIcon sx={{ mr: 1, color: 'var(--mainColor4)' }} />
                        Địa chỉ nhận hàng
                     </h3>

                     <div className={cn('address')}>
                        <h3 className={cn('customer-info')}>
                           {userInfo.nd_hoten} (+84) {userInfo.nd_phonenumber == '' ? '...' : userInfo.nd_phonenumber}
                        </h3>
                        <h3 className={cn('customer-address')}>
                           {userInfo.nd_address == '' ? '...' : userInfo.nd_address}
                        </h3>

                        <div className={cn('change-address-btn')}>
                           <IconButton sx={{ ml: 2, fontSize: 18, color: 'var(--mainColor4)' }} onClick={handleOpen}>
                              <DriveFileRenameOutlineOutlinedIcon />
                           </IconButton>
                        </div>

                        <Modal open={openModal} onClose={handleClose}>
                           <div className={cn('change-address-modal-container')} style={styleModal}>
                              <div
                                 className={cn('modal-header')}
                                 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                              >
                                 <h4 style={{ fontSize: 24, fontWeight: 400, color: '#333' }}>
                                    Cập nhật <b>Địa chỉ</b> và <b>Số điện thoại</b>
                                 </h4>

                                 <IconButton
                                    onClick={() => {
                                       setOpenModal(false);
                                    }}
                                 >
                                    <CloseIcon />
                                 </IconButton>
                              </div>

                              <div className={cn('modal-body')} style={{ marginTop: 26 }}>
                                 <TextField
                                    type="number"
                                    label="Số điện thoại"
                                    fullWidth
                                    margin="normal"
                                    size="large"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                 />

                                 <TextField
                                    label="Địa chỉ"
                                    fullWidth
                                    multiline
                                    margin="normal"
                                    size="large"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                 />
                              </div>

                              <div
                                 className={cn('modal-btns')}
                                 style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 26 }}
                              >
                                 <Button
                                    variant="outlined"
                                    sx={{ color: 'var(--mainColor4)', mr: 2 }}
                                    onClick={handleClose}
                                 >
                                    Hủy
                                 </Button>

                                 <Button
                                    variant="outlined"
                                    sx={{ color: 'var(--mainColor4)' }}
                                    onClick={handleUpdateInfo}
                                 >
                                    Thay đổi
                                 </Button>
                              </div>
                           </div>
                        </Modal>
                     </div>
                  </div>

                  <div className={cn('order')}>
                     <div className={cn('header-list')}>
                        <h4 className={cn('header-info')}>Sản phẩm</h4>

                        <h4 className={cn('header-price')}>Đơn giá</h4>

                        <h4 className={cn('header-amount')}>Số lượng</h4>

                        <h4 className={cn('header-total-price')}>Thành tiền</h4>
                     </div>

                     <div className={cn('products-list')}>
                        {listProd.listProd.map((product) => {
                           total += product.gia_km * product.sl_sp;
                           return (
                              <div className={cn('product')} key={product.ma_sp}>
                                 <div className={cn('product-info')}>
                                    <img src={'http://localhost:4000/' + product.anh_sp} alt="Anh san pham" />

                                    <h4 className={cn('product-name')}>{product.ten_sp}</h4>
                                 </div>

                                 <h4 className={cn('product-unit-price')}>{currencyFormater.format(product.gia_km)}</h4>

                                 <h4 className={cn('product-amount')}>{product.sl_sp}</h4>

                                 <h4 className={cn('product-total-price')}>
                                    {currencyFormater.format(product.gia_km * product.sl_sp)}
                                 </h4>
                              </div>
                           );
                        })}
                     </div>

                     <div className={cn('shipping-unit')}>
                        <h4 style={{ flex: '1', color: '#333' }}>Hình thức vận chuyển</h4>

                        <Select value={shipType} onChange={handleChange} sx={{ width: 'fit-content', fontSize: 19 }}>
                           <MenuItem value={50000} sx={{ fontSize: 19 }}>
                              Nhanh - {currencyFormater.format(50000)}
                           </MenuItem>
                           <MenuItem value={70000} sx={{ fontSize: 19 }}>
                              Hỏa tốc - {currencyFormater.format(70000)}
                           </MenuItem>
                        </Select>
                     </div>

                     <div className={cn('order-total')}>
                        <div className={cn('order-total-note')}>
                           <TextField
                              label="Ghi chú"
                              //  id="outlined-multiline-flexible"
                              fullWidth
                              multiline
                              maxRows={4}
                              margin="normal"
                              size="large"
                              value={note}
                              onChange={(e) => {
                                 setNote(e.target.value);
                              }}
                           />
                        </div>

                        <div className={cn('order-total-price')}>
                           <span style={{ fontSize: '20px' }}>Tổng số tiền: </span>
                           <h3>{currencyFormater.format(total + shipType)}</h3>
                        </div>
                     </div>
                  </div>

                  <div className={cn('payment-methods')}>
                     <h4>Phương thức thanh toán</h4>

                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <RadioGroup
                           defaultValue="COD"
                           row
                           aria-labelledby="demo-controlled-radio-buttons-group"
                           name="controlled-radio-buttons-group"
                           value={payMethod}
                           onChange={(e) => {
                              setPayMethod({ ...payMethod, method: e.target.value });
                           }}
                        >
                           <FormControlLabel
                              checked={payMethod.method === 'COD'}
                              value="COD"
                              control={<Radio />}
                              label="COD (Thanh toán trực tiếp khi nhận hàng)"
                           />
                           <FormControlLabel
                              checked={payMethod.method === 'Paypal'}
                              value="Paypal"
                              control={<Radio />}
                              label="Paypal"
                           />
                        </RadioGroup>

                        {payMethod.method === 'Paypal' ? (
                           <div className={cn('paypal-api')}>
                              <PayPalScriptProvider options={paypalOptions}>
                                 <PayPalButtons
                                    createOrder={(data, actions) => {
                                       var pay_total = (total + ship.gia) * 0.000043;

                                       return actions.order.create({
                                          purchase_units: [
                                             {
                                                amount: {
                                                   value: pay_total.toFixed(2),
                                                },
                                             },
                                          ],
                                       });
                                    }}
                                    onApprove={(data, actions) => {
                                       return actions.order.capture().then((details) => {
                                          // setPayment({ ...payment, status: 'Paid' });
                                          // toast.success('Thanh toán thành công! Bạn đã có thể đặt hàng.', {
                                          //    position: 'top-center',
                                          // });
                                       });
                                    }}
                                 />
                              </PayPalScriptProvider>
                           </div>
                        ) : (
                           <></>
                        )}
                     </div>
                  </div>

                  <div className={cn('total')}>
                     <h4 className={cn('total-price-products')}>
                        Tổng tiền hàng:<span>{currencyFormater.format(total)}</span>
                     </h4>

                     <h4 className={cn('ship-price')}>
                        Phí vận chuyển:<span>{currencyFormater.format(shipType)}</span>
                     </h4>

                     <h4 className={cn('total-pay')}>
                        Tổng thanh toán:
                        <span className={cn('total-pay-color')}>{currencyFormater.format(total + shipType)}</span>
                     </h4>

                     <div className={cn('submit-pay-btn')}>
                        <Button
                           variant="contained"
                           sx={{ width: '180px', height: '44px', fontSize: 20, fontWeight: 400 }}
                           onClick={handleOrder}
                        >
                           Đặt hàng
                        </Button>
                     </div>
                  </div>
               </>
            ) : (
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '50px' }}>
                  <h1>Đặt hàng thành công</h1>

                  <Link to={'/'}>
                     <Button
                        variant="outlined"
                        sx={{ height: '44px', fontSize: 20 }}
                        onClick={() => {
                           const reset_listpay_action = setPayList();
                           dispatch(reset_listpay_action);
                        }}
                     >
                        Tiếp tục mua hàng
                     </Button>
                  </Link>

                  <ReactToPrint
                     trigger={() => {
                        return (
                           <Button
                              startIcon={<LocalPrintshopRoundedIcon />}
                              variant="outlined"
                              sx={{ fontSize: 18, fontWeight: 400, mt: 2 }}
                           >
                              In hóa đơn
                           </Button>
                        );
                     }}
                     content={() => componentRef.current}
                  />

                  <div style={{ display: 'none' }}>
                     <div
                        className={cn('print-preview')}
                        ref={(el) => {
                           componentRef.current = el;
                        }}
                     >
                        <Bill user_info={userInfo} ship={shipType} />
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}

export default Payment;
