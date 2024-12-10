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
      await cloud.init() // init过程是异步的，需要等待init完成才可以发起调用
      that.cloud = cloud
    }
    try {
      console.log('请求参数:', {
        path: obj.path,
        method: obj.method || 'GET',
        data: obj.data
      })
      const result = await that.cloud.callContainer({
        path: obj.path,
        method: obj.method || 'GET',
        data: this.objectToQueryString(obj.data),
        header: {
          'X-WX-SERVICE': 'springboot-wji0',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      console.log('响应结果:', {
        errMsg: result.errMsg,
        callID: result.callID,
        data: result.data
      })
      return result.data
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
  },
  objectToQueryString(data) {
    if (!data) {
      return '';
    }
    return Object.keys(data)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&');
  },
  // 添加时间格式化工具函数
  formatTime(timeStr) {
    if (!timeStr || timeStr.length !== 14) return '';
    
    const month = timeStr.substring(4, 6);
    const day = timeStr.substring(6, 8);
    const hour = timeStr.substring(8, 10);
    const minute = timeStr.substring(10, 12);
    
    return `${parseInt(month)}月${parseInt(day)}日 ${hour}:${minute}`;
  },
  getStringLength(str){
    let len = 0;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code >= 0 && code <= 128) {
        len += 1;
      } else {
        len += 2;
      }
    }
    return len;
  }
});
