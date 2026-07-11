const router = require('express').Router()
const {
  getAllCourses, getCourseBySlug, getMyCourses,
  createCourse, updateCourse, deleteCourse
} = require('../controllers/course.controller')
const { protect } = require('../middleware/auth.middleware')
const { authorize } = require('../middleware/role.middleware')
const { imageUpload } = require('../middleware/upload.middleware')

router.get('/', getAllCourses)
router.get('/my/list', protect, authorize('instructor', 'admin'), getMyCourses)
router.get('/:slug', getCourseBySlug)

router.post('/', protect, authorize('instructor', 'admin'), imageUpload.single('thumbnail'), createCourse)
router.put('/:id', protect, authorize('instructor', 'admin'), imageUpload.single('thumbnail'), updateCourse)
router.delete('/:id', protect, authorize('admin'), deleteCourse)

module.exports = router