import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'CreditLimit',
    component: () => import('../views/CreditLimitPage.vue'),
    meta: { title: '指易融' },
  },
  // 后续按路径添加更多页面，例如：
  // { path: '/other', name: 'Other', component: () => import('../views/OtherPage.vue'), meta: { title: '其他' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title
  }
})

export default router
