export function formatAreaList(provinceResponseVos = []) {
    return provinceResponseVos.reduce(
      (res, item) => {
        const { provinceCode, provinceName, cityList = [] } = item
        // 省
        res.province_list[provinceCode] = provinceName
        // 市
        cityList.forEach(({ cityCode, cityName }) => {
          res.city_list[cityCode] = cityName
        })
        return res
      },
      {
        province_list: {},
        city_list: {},
      }
    )
  }

// 从 url 查询参数中取值（无 ? 时传空字符串，避免 URLSearchParams 报错）
export function getStringFromLocation(strKey) {
  const url = window.location.href || ''
  const queryString = url.split('?')[1] || ''
  const urlParams = new URLSearchParams(queryString)
  console.log('urlParams=====', url.split('?'))
  return urlParams.get(strKey) || ''
}