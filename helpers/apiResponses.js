exports.notFoundResponse = function (res, msg) {
  var data = {
    status_code: 0,
    status_text: msg,
  };
  return res.status(404).json(data);
};

exports.successResponse = (res, msg, data = null) => {
  let resData = {
    status_code: 1,
    status_text: msg,
  };
  if (data) {
    resData.data = data;
  }
  return res.status(200).json(resData);
};

exports.failResponse = (res, msg, data) => {
  let resData = {
    status_code: 0,
    status_text: msg,
  };
  if (data) {
    resData.data = data;
  }
  return res.status(400).json(resData);
};

exports.unAuthorizedResponse = function (res, msg) {
  var data = {
    status_code: 0,
    status_text: msg,
  };
  return res.status(403).json(data);
};
