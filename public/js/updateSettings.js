/*eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// type is eiher password or data
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:8000/api/v1/users/update-my-password'
        : 'http://127.0.0.1:8000/api/v1/users/update-me';
    const res = await axios({
      method: 'PATCH',
      url: url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
    }
  } catch (error) {
    console.warn(error);
    showAlert('error', error.response.data.message);
  }
};
