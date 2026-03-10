module.exports = function validateUrl(url) {

  try {
    new URL(url)
    return true
  } catch {
    return false
  }

}
