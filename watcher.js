class Watcher {
  constructor(vm, expr, cb) {
    this.vm = vm
    this.expr = expr
    this.cb = cb
    this.value = this.get()
  }
  getVal(vm, expr) {
    expr = expr.split('.')
    return expr.reduce((prev, next) => {
      return prev[next]
    }, vm.$data)
  }
  get() {
    Dep.target = this
    let value = this.getVal(this.vm, this.expr) // 会调用属性对应的get方法
    Dep.target = null
    return value
  }
  update() {
    let newValue = this.getVal(this.vm, this.expr)
    let oldValue = this.value
    if (newValue != oldValue) {
      this.cb(newValue)
    }
  }
}

class Dep {
  constructor() {
    // 订阅的数组
    this.subs = []
  }
  addSub(watcher) {
    this.subs.push(watcher)
  }
  notify() {
    this.subs.forEach(watcher => watcher.update())
  }
}
