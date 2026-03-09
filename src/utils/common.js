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