/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51MhaNJSDogoEHY6b3st5mxmhUxFp8WItUfG6AaLVKOCB3OmIUn9sTiNZ8iJXzicYIv6x3aA8Z4uwVp380UtErB1500mWQvEn5L'
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from api
    const session = await axios(
      `https://natoursrlm.netlify.app/api/v1/bookings/checkout-session/${tourId}`
    );

    // 2)Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    showAlert('error', error);
  }
};
