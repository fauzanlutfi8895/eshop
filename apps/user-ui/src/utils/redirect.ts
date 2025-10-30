let redirectToLogin = () => {
  console.log("Default redirectToLogin called, redirecting to /login");
  window.location.href = "/login";
};

export const setRedirectHandler = (handler: () => void) => {
  console.log("setRedirectHandler called, updating redirect handler");
  redirectToLogin = handler;
};

export const runRedirectToLogin = () => {
  console.log("runRedirectToLogin called");
  redirectToLogin();
};
