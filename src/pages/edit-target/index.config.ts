export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '靓健体重日志' })
  : { navigationBarTitleText: '靓健体重日志' }
