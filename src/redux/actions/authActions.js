import { AuthService } from '../../services/authService';
import { SecurityUtils } from '../../utils/securityUtils';

/**
 * Auth Actions
 */

export const loginWithCredentials = (username, password) => async (dispatch) => {
  dispatch({ type: 'LOGIN_REQUEST' });

  try {
    const response = await AuthService.loginWithCredentials(username, password);

    if (response.accessToken) {
      await SecurityUtils.storeToken(response.accessToken, 'access');
      if (response.refreshToken) {
        await SecurityUtils.storeToken(response.refreshToken, 'refresh');
      }
    }

    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      },
    });

    return response;
  } catch (error) {
    dispatch({
      type: 'LOGIN_FAILURE',
      payload: error.message || 'Login failed',
    });
    throw error;
  }
};

export const loginWithOTP = (mobileNumber, otp) => async (dispatch) => {
  dispatch({ type: 'LOGIN_REQUEST' });

  try {
    const response = await AuthService.loginWithMobileOTP(mobileNumber, otp);

    if (response.accessToken) {
      await SecurityUtils.storeToken(response.accessToken, 'access');
      if (response.refreshToken) {
        await SecurityUtils.storeToken(response.refreshToken, 'refresh');
      }
    }

    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      },
    });

    return response;
  } catch (error) {
    dispatch({
      type: 'LOGIN_FAILURE',
      payload: error.message || 'OTP login failed',
    });
    throw error;
  }
};

export const logout = () => async (dispatch) => {
  try {
    await AuthService.logout();
    await SecurityUtils.clearAllSecureData();
    dispatch({ type: 'LOGOUT' });
  } catch (error) {
    console.error('Logout error:', error);
    dispatch({ type: 'LOGOUT' });
  }
};

export const setUser = (user) => ({
  type: 'SET_USER',
  payload: user,
});

export const refreshAccessToken = (refreshToken) => async (dispatch) => {
  try {
    const response = await AuthService.refreshToken(refreshToken);

    if (response.accessToken) {
      await SecurityUtils.storeToken(response.accessToken, 'access');
      if (response.refreshToken) {
        await SecurityUtils.storeToken(response.refreshToken, 'refresh');
      }
    }

    dispatch({
      type: 'REFRESH_TOKEN_SUCCESS',
      payload: {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      },
    });

    return response;
  } catch (error) {
    console.error('Token refresh failed:', error);
    dispatch({ type: 'LOGOUT' });
    throw error;
  }
};
