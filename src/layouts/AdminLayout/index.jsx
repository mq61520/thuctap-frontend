import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames/bind';
import { Link } from 'react-router-dom';

import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';

import Tippy from '@tippyjs/react/headless';
import 'tippy.js/dist/tippy.css';

import styles from './AdminLayout.module.scss';
import Popper from '../../components/Popper';
import { changeLoginName, changeLoginPwd } from '../../app/slices/authSlice';

const cn = classNames.bind(styles);

function AdminLayout({ children }) {
   var toggle = window.location.pathname.slice(7).toString();
   const [alignment, setAlignment] = useState(toggle);
   const handleChange = (event, newAlignment) => {
      setAlignment(newAlignment);
   };

   const dispatch = useDispatch();
   const auth = useSelector((state) => state.auth);

   return (
      <div className={cn('page')}>
         <div className={cn('header')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div className={cn('header-logo')}>
                  <h1>BOOKstore</h1>
               </div>

               <div className={cn('choose-manager')} style={{ marginLeft: 20 }}>
                  <ToggleButtonGroup
                     color="primary"
                     value={alignment}
                     exclusive
                     onChange={handleChange}
                     aria-label="Platform"
                  >
                     <ToggleButton value="orders" style={{ padding: 0 }}>
                        <Link to={'/admin/orders'}>
                           <div className={cn('choose-btn')}>Quản lý đơn hàng</div>
                        </Link>
                     </ToggleButton>

                     <ToggleButton value="products" style={{ padding: 0 }}>
                        <Link to={'/admin/products'}>
                           <div className={cn('choose-btn')}>Quản lý hàng hóa</div>
                        </Link>
                     </ToggleButton>
                  </ToggleButtonGroup>
               </div>
            </div>

            <div className={cn('header-actions')}>
               <Tippy
                  interactive
                  render={(attrs) => (
                     <div className={cn('content')} tabIndex="-1" {...attrs}>
                        <Popper>
                           <Button
                              variant="contained"
                              startIcon={<LogoutOutlinedIcon />}
                              sx={{ backgroundColor: 'var(--mainColor4)' }}
                              onClick={() => {
                                 localStorage.setItem('admin_name', '');
                                 const action1 = changeLoginName('');
                                 const action2 = changeLoginPwd('');
                                 dispatch(action1);
                                 dispatch(action2);
                                 window.open('http://127.0.0.1:5173/login', '_self');
                              }}
                           >
                              Đăng xuất
                           </Button>
                        </Popper>
                     </div>
                  )}
               >
                  <div className={cn('account')}>
                     <h4>{localStorage.getItem('admin_name')}</h4>

                     {/* <img src={'http://localhost:4000/' + localStorage.getItem('avatar_name')} alt="Admin avatar" /> */}
                  </div>
               </Tippy>
            </div>
         </div>

         <div className={cn('children')}>{children}</div>
      </div>
   );
}

export default AdminLayout;
