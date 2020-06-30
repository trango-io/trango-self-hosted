
// Determine whether or not we have a querystring.
function hasQueryString() {
  return location.href.indexOf("?") !== -1;
}

// Handle the user's login and what happens next.
async function handleLogin() {
  if (hasQueryString()) {
    await enableVideo();
    console.log("After");
  } else {
    window.location = getRoomURL();
    await enableVideo();
  }
}
