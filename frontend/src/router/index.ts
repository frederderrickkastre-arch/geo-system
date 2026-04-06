import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const Layout = () => import('@/components/layout/AppLayout.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '用户登录', public: true },
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled' },
      },
      // AI素材源力
      {
        path: 'material/keyword',
        name: 'Keyword',
        component: () => import('@/views/material/keyword/index.vue'),
        meta: { title: '关键词', parent: 'AI素材源力' },
      },
      {
        path: 'material/question',
        name: 'Question',
        component: () => import('@/views/material/question/index.vue'),
        meta: { title: '写作标题', parent: 'AI素材源力' },
      },
      {
        path: 'material/image-gallery',
        name: 'ImageGallery',
        component: () => import('@/views/material/imageGallery/index.vue'),
        meta: { title: '企业画像图库', parent: 'AI素材源力' },
      },
      {
        path: 'material/knowledge-base',
        name: 'KnowledgeBase',
        component: () => import('@/views/material/knowledgeBase/index.vue'),
        meta: { title: '企业知识库', parent: 'AI素材源力' },
      },
      // AI文章写作
      {
        path: 'writing/prompt',
        name: 'WritingPrompt',
        component: () => import('@/views/writing/prompt/index.vue'),
        meta: { title: '写作指令', parent: 'AI文章写作' },
      },
      {
        path: 'writing/category',
        name: 'ArticleCategory',
        component: () => import('@/views/writing/category/index.vue'),
        meta: { title: '文章分类', parent: 'AI文章写作' },
      },
      {
        path: 'writing/task',
        name: 'AITask',
        component: () => import('@/views/writing/task/index.vue'),
        meta: { title: 'AI写作任务', parent: 'AI文章写作' },
      },
      {
        path: 'writing/article',
        name: 'ArticleList',
        component: () => import('@/views/writing/article/index.vue'),
        meta: { title: '文章列表', parent: 'AI文章写作' },
      },
      // AI流量复刻
      {
        path: 'traffic/hot-article',
        name: 'HotArticle',
        component: () => import('@/views/traffic/hotArticle/index.vue'),
        meta: { title: '全网爆文复刻', parent: 'AI流量复刻' },
      },
      {
        path: 'traffic/batch-rewrite',
        name: 'BatchRewrite',
        component: () => import('@/views/traffic/batchRewrite/index.vue'),
        meta: { title: '批量爆文复刻', parent: 'AI流量复刻' },
      },
      // 文章发布 - 网站媒体
      {
        path: 'publish/web-media',
        name: 'WebMedia',
        component: () => import('@/views/publish/webMedia/index.vue'),
        meta: { title: '发布媒体', parent: '网站媒体' },
      },
      {
        path: 'publish/web-media/records',
        name: 'WebMediaRecords',
        component: () => import('@/views/publish/webMedia/records.vue'),
        meta: { title: '投稿记录', parent: '网站媒体' },
      },
      // 自媒体大V
      {
        path: 'publish/self-media',
        name: 'SelfMedia',
        component: () => import('@/views/publish/selfMedia/index.vue'),
        meta: { title: '发布自媒体', parent: '自媒体大V' },
      },
      {
        path: 'publish/self-media/records',
        name: 'SelfMediaRecords',
        component: () => import('@/views/publish/selfMedia/records.vue'),
        meta: { title: '投稿记录', parent: '自媒体大V' },
      },
      // 个人自媒体
      {
        path: 'publish/personal-media',
        name: 'PersonalMedia',
        component: () => import('@/views/publish/personalMedia/index.vue'),
        meta: { title: '账号授权', parent: '个人自媒体' },
      },
      {
        path: 'publish/personal-media/tasks',
        name: 'PersonalMediaTasks',
        component: () => import('@/views/publish/personalMedia/tasks.vue'),
        meta: { title: '发布任务', parent: '个人自媒体' },
      },
      {
        path: 'publish/personal-media/records',
        name: 'PersonalMediaRecords',
        component: () => import('@/views/publish/personalMedia/records.vue'),
        meta: { title: '发布记录', parent: '个人自媒体' },
      },
      // AI官网SEO
      {
        path: 'publish/seo',
        name: 'SEOSite',
        component: () => import('@/views/publish/seo/index.vue'),
        meta: { title: '站点管理', parent: 'AI官网SEO' },
      },
      {
        path: 'publish/seo/tasks',
        name: 'SEOTasks',
        component: () => import('@/views/publish/seo/tasks.vue'),
        meta: { title: 'SEO发布任务', parent: 'AI官网SEO' },
      },
      {
        path: 'publish/seo/records',
        name: 'SEORecords',
        component: () => import('@/views/publish/seo/records.vue'),
        meta: { title: '发布记录', parent: 'AI官网SEO' },
      },
      // AI数据中心
      {
        path: 'data/report',
        name: 'DataReport',
        component: () => import('@/views/data/report/index.vue'),
        meta: { title: '数据报表', parent: 'AI数据中心' },
      },
      {
        path: 'data/query',
        name: 'DataQuery',
        component: () => import('@/views/data/query/index.vue'),
        meta: { title: '查询(带截图)', parent: 'AI数据中心' },
      },
      {
        path: 'data/query-records',
        name: 'QueryRecords',
        component: () => import('@/views/data/query/records.vue'),
        meta: { title: '查询记录', parent: 'AI数据中心' },
      },
      // AI工具助手
      {
        path: 'tools/keyword-index',
        name: 'KeywordIndex',
        component: () => import('@/views/tools/keywordIndex/index.vue'),
        meta: { title: '关键词指数', parent: 'AI工具助手' },
      },
      {
        path: 'tools/ai-expand',
        name: 'AIExpand',
        component: () => import('@/views/tools/aiExpand/index.vue'),
        meta: { title: 'AI拓词', parent: 'AI工具助手' },
      },
      {
        path: 'tools/manual-expand',
        name: 'ManualExpand',
        component: () => import('@/views/tools/manualExpand/index.vue'),
        meta: { title: '手动拓词工具', parent: 'AI工具助手' },
      },
      // 个人中心
      {
        path: 'user/consumption',
        name: 'Consumption',
        component: () => import('@/views/user/consumption/index.vue'),
        meta: { title: '消耗明细', parent: '消耗明细' },
      },
      {
        path: 'user/verification',
        name: 'Verification',
        component: () => import('@/views/user/verification/index.vue'),
        meta: { title: '实名认证' },
      },
      {
        path: 'user/benefits',
        name: 'Benefits',
        component: () => import('@/views/user/benefits/index.vue'),
        meta: { title: '账号权益' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  NProgress.start()
  document.title = `${to.meta.title || 'GEO优化排名系统'} - GEO优化排名系统`
  const userStore = useUserStore()
  if (to.meta.public) {
    next()
  } else if (!userStore.isLoggedIn) {
    next('/login')
  } else {
    userStore.restoreSession()
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
