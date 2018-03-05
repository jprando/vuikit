import { $ } from 'vuikit/src/util/core'
import { warn } from 'vuikit/src/util/debug'
import { escape } from 'vuikit/src/util/selector'
import { on, trigger } from 'vuikit/src/util/event'
import { height, offset } from 'vuikit/src/util/dimensions'
import { clamp, isObject, assign } from 'vuikit/src/util/lang'

const NAMESPACE = '__vkScroll'

export default {
  bind (el, binding, vnode) {
    el[NAMESPACE] = {}
    el[NAMESPACE].options = getOptions({ binding, vnode })
  },
  inserted (el, binding, vnode) {
    const anchor = el.nodeName === 'A'
      ? el
      : $('a', el)

    if (!anchor) {
      warn('v-vk-scroll -> Anchor not found', vnode.context)
      return
    }

    el[NAMESPACE].unbind = on(anchor, 'click', e => {
      if (e.defaultPrevented) {
        return
      }

      e.preventDefault()

      scrollTo(anchor, escape(anchor.hash).substr(1), el[NAMESPACE].options)
    })
  },
  componentUpdated (el, binding, vnode) {
    el[NAMESPACE].options = getOptions({ binding, vnode })
  },
  unbind (el) {
    el[NAMESPACE].unbind()
    delete el[NAMESPACE]
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

  if (!trigger(fromEl, 'beforescroll', [fromEl])) {
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
      trigger(fromEl, 'scrolled', [fromEl])
    }
  }

  step()
}

function ease (k) {
  return 0.5 * (1 - Math.cos(Math.PI * k))
}

function getOptions (ctx) {
  const { value } = ctx.binding

  if (process.env.NODE_ENV !== 'production' && value && !isObject(value)) {
    warn('v-vk-scroll -> Object expected as configuration', ctx.vnode.context)
  }

  const options = assign({
    offset: 0,
    duration: 1000
  }, value)

  return options
}