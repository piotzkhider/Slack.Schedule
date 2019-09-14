exports.Verify = token => {
  return process.env.VERIFICATION_TOKEN === token
};