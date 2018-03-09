import { $, $$ } from 'vuikit/src/util/core'
import { warn } from 'vuikit/src/util/debug'
import { escape } from 'vuikit/src/util/selector'
import { on, trigger } from 'vuikit/src/util/event'
import { height, offset } from 'vuikit/src/util/dimensions'
import { clamp, isString, assign, noop } from 'vuikit/src/util/lang'

const NAMESPACE = '__vkScroll'

export default {
  bind (el, binding, vnode) {
    el[NAMESPACE] = {}
    el[NAMESPACE].unbind = noop
    el[NAMESPACE].options = getOptions({ binding, vnode })
  },
  inserted (el, binding, vnode) {
    vnode.context.$nextTick(() => {
      apply(el, { binding, vnode })
    })
  },
  componentUpdated (el, binding, vnode) {
    el[NAMESPACE].unbind()
    el[NAMESPACE].options = getOptions({ binding, vnode })
    vnode.context.$nextTick(() => {
      apply(el, { binding, vnode })
    })
  },
  unbind (el) {
    el[NAMESPACE].unbind()
    delete el[NAMESPACE]
  }
}

function apply (el, { vnode }) {
  const opts = el[NAMESPACE].options
  const isAnchor = el => el.nodeName === 'A'

  let anchors = isAnchor(el)
    ? [el]
    : $$(opts.target, el)

  if (process.env.NODE_ENV !== 'production' && (!anchors.length || !anchors.every(isAnchor))) {
    warn('v-vk-scroll -> no anchors were matched', vnode.context)
  }

  const unbinds = anchors.map(anchor => {
    return on(anchor, 'click', e => {
      if (e.defaultPrevented) {
        return
      }

      e.preventDefault()
      scrollTo(anchor, escape(anchor.hash).substr(1), opts)
    })
  })

  el[NAMESPACE].unbind = () => {
    unbinds.forEach(fn => fn())
  }
}

function scrollTo (fromEl, toEl, options) {
  toEl = (toEl && $(toEl)) || document.body

  const docHeight = height(document)
  const winHeight = height(window)

  let target = offset(toEl).top - options.offset
  if (target + winHeight > docHeight) {
    target = docHeight - winHeight
  }

  if (!trigger(fromEl, 'beforeScroll', [fromEl])) {
    return
  }

  const start = Date.now()
  const startY = window.pageYOffset
  const step = () => {
    const currentY = startY + (target - startY) * ease(
      clamp((Date.now() - start) / options.duration)
    )

    window.scrollTo(window.pageXOffset, currentY)

    // scroll more if we have not reached our destination
    if (currentY !== target) {
      requestAnimationFrame(step)
    } else {
      trigger(fromEl, 'afterScroll', [fromEl])
    }
  }

  step()
}

function ease (k) {
  return 0.5 * (1 - Math.cos(Math.PI * k))
}

function getOptions (ctx) {
  let { value } = ctx.binding

  if (isString(value)) {
    value = { target: value }
  }

  return assign({
    offset: 0,
    target: 'a',
    duration: 1000
  }, value)
}
