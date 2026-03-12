import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'CreditLimit',
    component: () => import('../views/CreditLimitPage.vue'),
    meta: { title: '指易融' },
  },
  {
    path: '/download',
    name: 'Download',
    component: () => import('../views/DownloadPromptPage.vue'),
    meta: { title: '下载指易融APP' },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title
  }
})

export default router
