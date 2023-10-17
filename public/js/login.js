/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://https://natoursrlm.vercel.app//api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully !');
      setTimeout(() => {
        location.assign('/');
      }, 500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'https://natoursrlm.vercel.app/api/v1/users/logout',
    });

    if ((res.data.status = 'success')) {
      location.reload(true);
      location.assign('/');
    }
  } catch (error) {
    showAlert('error', 'Error logging out. Try again later !');
  }
};
