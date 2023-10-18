/*eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// type is eiher password or data
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'https://natoursrlm.netlify.app/api/v1/users/update-my-password'
        : 'https://natoursrlm.netlify.app/api/v1/users/update-me';
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
