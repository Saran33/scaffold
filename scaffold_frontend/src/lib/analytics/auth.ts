import { sendGAEvent } from '@next/third-parties/google';

/**
 * Authentication pages analytics tracking
 * Covers login, register, and signup pages
 */
export const AuthAnalytics = {
  // Page views
  viewLoginPage: () =>
    sendGAEvent('event', 'page_view', {
      page_title: 'Login',
      page_location: '/login',
    }),

  viewRegisterPage: () =>
    sendGAEvent('event', 'page_view', {
      page_title: 'Register',
      page_location: '/register',
    }),

  viewSignupPage: () =>
    sendGAEvent('event', 'page_view', {
      page_title: 'Signup',
      page_location: '/signup',
    }),

  // Navigation between auth pages
  clickBackButton: (fromPage: 'login' | 'register' | 'signup') =>
    sendGAEvent('event', 'auth_navigation', {
      action: 'back',
      from_page: fromPage,
    }),

  clickLoginFromRegister: () =>
    sendGAEvent('event', 'auth_navigation', {
      action: 'to_login',
      from_page: 'register',
    }),

  clickRegisterFromLogin: () =>
    sendGAEvent('event', 'auth_navigation', {
      action: 'to_register',
      from_page: 'login',
    }),

  // Authentication method clicks
  clickLoginProvider: (provider: string) =>
    sendGAEvent('event', 'login', { method: provider }),

  clickRegisterProvider: (provider: string) =>
    sendGAEvent('event', 'sign_up', { method: provider }),

  // Form interactions
  startLoginForm: () =>
    sendGAEvent('event', 'form_start', { form_name: 'login_credentials' }),

  startRegisterForm: () =>
    sendGAEvent('event', 'form_start', { form_name: 'register_credentials' }),

  submitLoginForm: () =>
    sendGAEvent('event', 'form_submit', { form_name: 'login_credentials' }),

  submitRegisterForm: () =>
    sendGAEvent('event', 'form_submit', { form_name: 'register_credentials' }),

  // Form validation errors
  formValidationError: (formType: 'login' | 'register', errorField: string) =>
    sendGAEvent('event', 'form_error', {
      form_name: formType,
      error_field: errorField,
    }),

  // Auth success/failure
  loginSuccess: (method: string) =>
    sendGAEvent('event', 'login_success', { method }),

  loginFailure: (method: string, errorType: string) =>
    sendGAEvent('event', 'login_failure', { method, error_type: errorType }),

  registerSuccess: (method: string) =>
    sendGAEvent('event', 'sign_up_success', { method }),

  registerFailure: (method: string, errorType: string) =>
    sendGAEvent('event', 'sign_up_failure', { method, error_type: errorType }),

  // Signup flow (multi-step process)
  signupStepView: (stepNumber: number, stepName: string) =>
    sendGAEvent('event', 'signup_step_view', {
      step_number: stepNumber,
      step_name: stepName,
    }),

  signupStepComplete: (stepNumber: number, stepName: string) =>
    sendGAEvent('event', 'signup_step_complete', {
      step_number: stepNumber,
      step_name: stepName,
    }),

  signupPlanSelect: (planName: string) =>
    sendGAEvent('event', 'signup_plan_select', { plan_name: planName }),

  signupComplete: () => sendGAEvent('event', 'signup_complete', { value: 1 }),

  // Password-related interactions
  clickShowPassword: (formType: 'login' | 'register') =>
    sendGAEvent('event', 'password_visibility_toggle', {
      form_name: formType,
      action: 'show',
    }),

  clickForgotPassword: () =>
    sendGAEvent('event', 'forgot_password_click', { location: 'login_form' }),

  // Legal links on auth pages (not footer, but inline links)
  clickAuthTerms: () =>
    sendGAEvent('event', 'legal_click', {
      legal_page: 'terms',
      location: 'auth_form',
    }),

  clickAuthPrivacy: () =>
    sendGAEvent('event', 'legal_click', {
      legal_page: 'privacy',
      location: 'auth_form',
    }),
};
