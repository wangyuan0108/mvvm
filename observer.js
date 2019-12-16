class Observer {
    constructor(data) {
      this.observe(data)
    }
    observe(data) {
      if (!data || typeof data !== 'object') {
        return
      }
      Object.keys(data).forEach(key => {
        this.defineReactive(data, key, data[key])
        this.observe(data[key])
      })
    }
    defineReactive(obj, key, value) {
      let that = this
      let dep = new Dep()
      Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get() {
          // 当取值时调用的方法
          Dep.target && dep.addSub(Dep.target)
          return value
        },
        set(newValue) {
          if (newValue != value) {
            that.observe(newValue)
            value = newValue
            dep.notify() // 通知所有人 数据更新了
          }
        }
      })
    }
  }