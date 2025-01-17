const express = require('express');
const router = express.Router();

const { check, validationResult } = require('express-validator');
const { asyncHandler, csrfProtection } = require("./utils");
const { Question, User, Answer, ScoringAnswer } = require("../db/models");
const { requireAuth } = require('../auth');

const questionValidator = [
    check('title')
        .exists({ checkFalsy: true })
        .withMessage('Please provide a title for your question')
        .isLength({ max: 255 })
        .withMessage('Title cannot be longer than 255 characters')
        .custom(value => {
            return Question.findOne({
                where: { title: value }
            })
                .then(question => {
                    if (question) {
                        return Promise.reject('This question has already been asked, search for the thread')
                    }
                });
        }),
    check('content')
        .exists({ checkFalsy: true })
        .withMessage('Please provide content for your question')
];


router.get('/new', requireAuth, csrfProtection, (req, res) => {
    res.render('new-question', { csrfToken: req.csrfToken(), title: 'Ask a Question - Nap Overflow', question: {} });
});

router.get('/', asyncHandler(async (req, res, next) => {
    const questions = await Question.findAll({ include: User, order: [["updatedAt", "DESC"]] });
    res.render('questions-list', { title: 'All Questions - Nap Overflow', questions });
}))

router.post('/', requireAuth, questionValidator, csrfProtection, asyncHandler(async (req, res) => {

    const { title, content } = req.body;
    const userId = res.locals.user.id;
    const question = await Question.build({
        title, content, userId
    });

    const validatorErrors = validationResult(req);

    if (validatorErrors.isEmpty()) {
        await question.save();
        res.redirect(`/questions/${question.id}`);
    } else {
        const errors = validatorErrors.array().map(error => error.msg);
        res.render('new-question', { csrfToken: req.csrfToken(), question, errors, title: 'Ask a Question - Nap Overflow' });
    };
}));


router.get("/:id(\\d+)", csrfProtection, async (req, res) => {
    const questionId = parseInt(req.params.id, 10);
    const question = await Question.findByPk(questionId, { include: User });

    // console.log(question.title, question.content);
    const content = question.content;

    const answers = await Answer.findAll({
        where: { questionId },
        include: [User, ScoringAnswer]
    });
    // console.log(answers);

    // console.log(answers[0].ScoringAnswers[0].vote);

    let persistObj = {};
    answers.forEach(answer => {
        if (answer.ScoringAnswers.length) {
            answer.ScoringAnswers.forEach(score => {
                if (res.locals.user) {
                    const loggedinUserId = res.locals.user.id;
                    if (score.userId === loggedinUserId) {
                        persistObj[answer.id] = score.vote;
                    }
                }
            })
        }
    });

    res.render("question", { question, content, answers, persistObj, csrfToken: req.csrfToken(), title: `${question.title} - Nap Overflow` });
});

router.post("/:id(\\d+)/delete", requireAuth, asyncHandler(async (req, res) => {
    const questionId = parseInt(req.params.id, 10);
    const question = await Question.findByPk(questionId);
    const answers = await Answer.findAll({ where: { questionId } });

    answers.forEach(ans => {
        // console.log(ans)
        ScoringAnswer.destroy({ where: { answerId: ans.id } });
        ans.destroy();
    })

    // answers.forEach(ans => ans.destroy());

    await question.destroy();
    res.redirect("/questions");
})
);

module.exports = router;
