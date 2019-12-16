class Compile {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el)
    this.vm = vm
    if (this.el) {
      let fragment = this.node2fragment(this.el)
      this.compile(fragment)
      this.el.appendChild(fragment)
    }
  }

  isElementNode(node) {
    return node.nodeType === 1
  }
  isDirective(name) {
    return name.includes('v-')
  }

  compileElement(node) {
    let attrs = node.attributes
    Array.from(attrs).forEach(attr => {
      let attrName = attr.name
      if (this.isDirective(attrName)) {
        let expr = attr.value
        let [, type] = attrName.split('-')
        CompileUtil[type](node, this.vm, expr)
      }
    })
  }
  compileText(node) {
    let expr = node.textContent
    let reg = /\{\{([^}]+)\}\}/
    if (reg.test(expr)) {
      CompileUtil['text'](node, this.vm, expr)
    }
  }
  compile(fragment) {
    let childNodes = fragment.childNodes
    Array.from(childNodes).forEach(node => {
      if (this.isElementNode(node)) {
        this.compileElement(node)
        this.compile(node)
      } else {
        this.compileText(node)
      }
    })
  }
  node2fragment(el) {
    let fragment = document.createDocumentFragment()
    let firstChild
    while ((firstChild = el.firstChild)) {
      fragment.appendChild(firstChild)
    }
    return fragment
  }
}

CompileUtil = {
  text(node, vm, expr) {
    let updateFn = this.updater['textUpdater']
    let value = this.getTextVal(vm, expr)
    expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
      new Watcher(vm, arguments[1], newValue => {
        // 如果数据变化了，文本节点需要重新获取依赖的属性更新文本中的内容
        updateFn && updateFn(node, this.getTextVal(vm, expr))
      })
    })
    updateFn && updateFn(node, value)
  },
  setVal(vm, expr, value) {
    expr = expr.split('.')
    return expr.reduce((prev, next, currentIndex) => {
      if (currentIndex === expr.length - 1) {
        return (prev[next] = value)
      }
      return prev[next]
    }, vm.$data)
  },
  model(node, vm, expr) {
    let updateFn = this.updater['modelUpdater']
    new Watcher(vm, expr, newValue => {
      // 当值变化后会调用cb 将新的值传递过来
      updateFn && updateFn(node, newValue)
    })
    // 这里应该加一个监控 数据变化了 应该调用这个watch的callback
    node.addEventListener('input', e => {
      let newValue = e.target.value
      // 监听输入事件将输入的内容设置到对应数据上
      this.setVal(vm, expr, newValue)
    })
    updateFn && updateFn(node, this.getVal(vm, expr))
  },
  updater: {
    // 文本更新
    textUpdater(node, value) {
      node.textContent = value
    },
    // 输入框更新
    modelUpdater(node, value) {
      node.value = value
    }
  },
  getTextVal(vm, expr) {
    // 获取编译文本后的结果
    return expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
      // 依次去去数据对应的值
      return this.getVal(vm, arguments[1])
    })
  },
  getVal(vm, expr) {
    // 获取实例上对应的数据
    expr = expr.split('.') // {{message.a}} [message,a] 实现依次取值
    // vm.$data.message => vm.$data.message.a
    return expr.reduce((prev, next) => {
      return prev[next]
    }, vm.$data)
  }
}
