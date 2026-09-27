import type { RouteRecordRaw } from 'vue-router'
import { accessRules } from '../access-rules'
const meta = {
    titleKey: 'assignments.assignedTitle',
    requiresAuth: true,
    ...accessRules.assignments,
}
export const assignmentRoutes: RouteRecordRaw[] = [
    {
        path: '/assignments',
        name: 'assignments',
        component: () => import('@/views/assignments/AssignmentListPage.vue'),
        meta,
    },
    {
        path: '/assignments/:id',
        name: 'assignment-detail',
        component: () => import('@/views/assignments/AssignmentDetailPage.vue'),
        meta,
    },
]
