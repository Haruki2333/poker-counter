// app.js
App({
  async onLaunch() {
    // 这里演示如何在app.js中使用，没有用请删掉
    // const res = await this.call({
    //   path:'/',
    //   method: 'POST'
    // })
    // console.log('业务返回结果',res)
  },
  /**
   * 封装的微信云托管调用方法
   * @param {*} obj 业务请求信息，可按照需要扩展
   * @param {*} number 请求等待，默认不用传，用于初始化等待
   */
  async call(obj, number = 0) {
    const that = this
    if (that.cloud == null) {
      const cloud = new wx.cloud.Cloud({
        resourceAppid: 'wxf0685107124f2bda', // 微信云托管环境所属账号，服务商appid、公众号或小程序appid
        resourceEnv: 'prod-4ggog6ad90496e45', // 微信云托管的环境ID
      })
      await that.cloud.init() // init过程是异步的，需要等待init完成才可以发起调用
      that.cloud = cloud
    }
    try {
      const result = await that.cloud.callContainer({
        path: obj.path, // 填入业务自定义路径和参数，根目录，就是 / 
        method: obj.method || 'GET', // 按照自己的业务开发，选择对应的方法
        // dataType:'text', // 如果返回的不是json格式，需要添加此项
        header: {
          'X-WX-SERVICE': 'springboot-wji0', // xxx中填入服务名称（微信云托管 - 服务管理 - 服务列表 - 服务名称）
          // 其他header参数
        }
        // 其余参数同 wx.request
      })
      console.log(`微信云托管调用结果${result.errMsg} | callid:${result.callID}`)
      return result.data // 业务数据在data中
    } catch (e) {
      const error = e.toString()
      // 如果错误信息为未初始化，则等待300ms再次尝试，因为init过程是异步的
      if (error.indexOf("Cloud API isn't enabled") != -1 && number < 3) {
        return new Promise((resolve) => {
          setTimeout(function () {
            resolve(that.call(obj, number + 1))
          }, 300)
        })
      } else {
        throw new Error(`微信云托管调用失败${error}`)
      }
    }
  }
});
