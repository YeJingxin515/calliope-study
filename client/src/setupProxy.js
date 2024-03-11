const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (app) {
  // /api 表示代理路径
  // target 表示目标服务器的地址
  app.use(
    createProxyMiddleware('/file', {
      target: 'http://172.30.138.189:6038',
      changeOrigin: true,
      pathRewrite: {
        '^/file': '' // 这样处理后，最终得到的接口路径为： http://localhost:8080/xxx
      }
    })
  )
}
