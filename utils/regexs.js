module.exports = {
  EMAIL_REGEX: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  // NOTICE: The forest password should be composed of digit, at least on capital letter
  //         and one lower case letter. It also accepts special characters except whitespaces.
  PASSWORD_REGEX: /^(?=\S*?[A-Z])(?=\S*?[a-z])((?=\S*?[0-9]))\S{8,}$/,
};
