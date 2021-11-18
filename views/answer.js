extends layout

block content
    div.content
        div.answerform
            if errors
                div.errors
                    p The following error occured:
                    ul
                        each error in errors
                            li=error
            form(action=`/questions/${question.id}/answers`, method='post')
                input(type='hidden',name='_csrf',value=csrfToken)
                p.body Your Answer
                textarea(style='resize: none',name ='answerContents') #{answer.content}
                button.submit(name='submitAnswer') Submit Answer
