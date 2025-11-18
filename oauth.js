
const userManager = new oidc.UserManager(OIDC_CONFIG);

function toggleLogin() {
  userManager.getUser().then(user => {
    if (user) {
      userManager.signoutRedirect();
    } else {
      userManager.signinRedirect();
    }
  });
}

userManager.getUser().then(user => {
  if (user) {
    const username = user.profile.preferred_username;
    document.getElementById("loginBtn").textContent = "Logout (" + username + ")";
  }
});
