if (process.env.ROOT_URL) {
  if (!window.location.pathname.includes(process.env.ROOT_URL)) {
    window.history.replaceState(
      "",
      "",
      process.env.ROOT_URL + window.location.pathname
    );
  }
} else {
  console.log("ROOT_URL is not set");
}
