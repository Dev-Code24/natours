/* eslint-disable import/no-extraneous-dependencies */
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../model/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

// eslint-disable-next-line arrow-body-style
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  // Remove password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  const url = `${req.protocol}://${req.get(`host`)}/me`;

  await new Email(newUser, url).sendWelcome();
  createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Provide an email and password', 400));
  }
  // 2) Check if email && password are correct

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invalid email or password', 401));
  }
  // 3) If everything is okay then send json token to client
  createAndSendToken(user, 200, res);
});

exports.logOut = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //1) Get the token, check if it exist
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('Login first to get access', 401));
  }

  //2) Verification of the token

  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  //3) If verification successfull, then check if user still exists

  const freshUser = await User.findById(decodedPayload.id);
  if (!freshUser) return next(new AppError('User does not exist', 401));

  //4) Check if user changed the password after the jwt token was issued
  if (freshUser.changedPasswordAfter(decodedPayload.iat)) {
    return next(new AppError('User has changed the password', 401));
  }

  // GRANT ACCESS TO PROTECTED ROUTES
  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

//only for rendering pages
exports.isLoggedIn = async (req, res, next) => {
  //1) Get the token, check if it exist

  if (req.cookies.jwt) {
    try {
      // Verifies the token
      const decodedPayload = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //3) If verification successfull, then check if user still exists

      const freshUser = await User.findById(decodedPayload.id);
      if (!freshUser) return next();

      //4) Check if user changed the password after the jwt token was issued
      if (freshUser.changedPasswordAfter(decodedPayload.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = freshUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('Resritcted route. You do not have permission.', 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get the email POSTed by user

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('No user found', 404));
  }
  // 2) Generate the random reset token

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/reset-password/${resetToken}`;

    // Send it to users mail

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'A token has been sent on your registered mail.',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('Error occured while sending mail ! Try again.', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2) Set new password if token not expired
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3) Update changedPasswordAt property for the user
  //4) Log the user in and send JWT
  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get user from the collection
  const user = await User.findById(req.user.id).select('+password');
  //2) Check if POSTed current password in correct
  if (!user.correctPassword(req.body.currentPassword, user.password)) {
    return next(
      new AppError('Password does not match the confirmed password', 401)
    );
  }
  //3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4) Log user in, send JWT
  createAndSendToken(user, 200, res);
});
