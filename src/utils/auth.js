// import Cookies from 'js-cookie' // 注释掉原来的 Cookie 引用

const TokenKey = 'Admin-Token'

export function getToken() {
  // return Cookies.get(TokenKey)
  return localStorage.getItem(TokenKey) // 改用 localStorage
}

export function setToken(token) {
  // return Cookies.set(TokenKey, token)
  return localStorage.setItem(TokenKey, token) // 改用 localStorage
}

export function removeToken() {
  // return Cookies.remove(TokenKey)
  return localStorage.removeItem(TokenKey) // 改用 localStorage
}