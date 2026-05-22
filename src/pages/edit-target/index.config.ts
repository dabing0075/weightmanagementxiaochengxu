export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '设置健康目标' })
  : { navigationBarTitleText: '设置健康目标' }
