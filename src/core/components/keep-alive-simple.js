/* @flow */

import { remove } from 'shared/util'
import { getFirstComponentChild } from 'core/vdom/helpers/index'

type VNodeCache = { [key: string]: ?VNode };



/** 根据key删除某个缓存 */
function pruneCacheEntry (
  cache: VNodeCache,
  key: string,
  keys: Array<string>,
  current?: VNode
) {
  const cached = cache[key]
  if (cached && (!current || cached.tag !== current.tag)) {
    cached.componentInstance.$destroy()
  }
  cache[key] = null
  remove(keys, key)
}


export default {
  name: 'keep-alive',
  abstract: true,


  created () {
    this.cache = Object.create(null)
    this.keys = []
  },

  destroyed () {
    /** 当销毁时清除所有缓存 */
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },


  render () {
    /** 获取子组件 */
    const slot = this.$slots.default
    /** 获取子组件vnode */
    const vnode: VNode = getFirstComponentChild(slot)
    /** 获取子组件配置 */
    const componentOptions: ?VNodeComponentOptions = vnode && vnode.componentOptions
    /** 存在子组件的情况 */
    if (componentOptions) {
      /** keep-alive 的缓存和缓存的keys */
      const { cache, keys } = this
      /** 获取子组件的key */
      const key: ?string = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
        : vnode.key
      /** 缓存中有该子组件的key */
      if (cache[key]) {
        /** 替换组件的实例为缓存实例 */
        vnode.componentInstance = cache[key].componentInstance
        // make current key freshest
        remove(keys, key)
        keys.push(key)
      } else {
        /** 子组件加入缓存 */
        cache[key] = vnode
        keys.push(key)
      }
      /** 给子组件加上 keep-alive 标记 */
      vnode.data.keepAlive = true
    }
    /** 返回子组件 */
    return vnode || (slot && slot[0])
  }
}
