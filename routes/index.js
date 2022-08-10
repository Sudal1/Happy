const router   = require('express').Router()
const jwtauth  = require('../middlewares/jwtauth').checkToken
const store    = require('../middlewares/multer')
const sign     = require('../controller/sign')
const family   = require('../controller/family')
const member   = require('../controller/member')
const photo    = require('../controller/photo')
const wish     = require('../controller/wish')
const mail     = require('../controller/mail')
const fcm      = require('../controller/fcm')

/*
 * Sign
 */
router.post('/getSmsCode', sign.getSmsCode)
router.post('/signUp', sign.signUp)
router.post('/signIn', sign.signIn)

/* 
 * Family
 */
router.get('/family', jwtauth, family.getFamily)
router.post('/family', jwtauth, family.joinFamily)
router.delete('/family', jwtauth, family.leaveFamily)

/*
 * Photo
 */
router.get('/photo', jwtauth, photo.syncPhoto)
router.post('/photo', store.any(), jwtauth, photo.uploadPhoto)
router.put('/photo', jwtauth, photo.movePhoto)
router.delete('/photo', jwtauth, photo.deletePhoto)

/*
 * Wish
 */
router.get('/wish', jwtauth, wish.syncWish)
router.post('/wish', jwtauth, wish.writeWish)
router.put('/wish', jwtauth, wish.finishWish)
router.delete('/wish', jwtauth, wish.deleteWish)

/*
 * Mail
 */
router.get('/mail', jwtauth, mail.syncMail)
router.post('/mail', jwtauth, mail.writeMail)
router.put('/mail', jwtauth, mail.markMail)
// router.get('/pushmail', jwtauth, mail.sendPush)

/*
 * Fcm
 */
router.post('/fcm', jwtauth, fcm.createFcm)

/*
 * Member
 */
router.get('/user', jwtauth, member.getMembers)
// router.get('/reset', member.resetAllMembers)

module.exports = router