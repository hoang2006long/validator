function Validator(option) {
    // trong trường hợp thẻ input nằm bên trong nhiều thẻ div thì vẫn get ra được form-group để add lỗi khi người dùng nhập sai
    // có thể dùng hàm có sẵn closest
    function getParrent(element, selector) {
        while(element.parentElement) {
            if (element.parentElement.matches(selector) ) {
                return element.parentElement
            }
            element = element.parentElement
        }
    }

    // biến lưu lại các rule 
    let selectorRules = {}

    // hàm thực hiện báo lỗi khi người dùng nhập không hợp lệ
    function validate(rule,inputElement) {
        let errorMessage;
        const errorElement = getParrent(inputElement, option.formGroup).querySelector(option.errorMessage)

        const rulesOfEachElement = selectorRules[rule.selector] // rulesOfEachElement chứa tất cả các rule của chỉ 1 element được onblur

        // Lặp qua từng rule và kiểm tra, nếu có lỗi thì dừng việc kiểm tra
        for (let i = 0; i < rulesOfEachElement.length; i++) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rulesOfEachElement[i]( // rulesOfEachElement[i] tương ứng với rule.test
                        formElement.querySelector(rule.selector + ':checked')
                    )
                    break
                default:
                    errorMessage = rulesOfEachElement[i](inputElement.value) // rulesOfEachElement[i] tương ứng với rule.test
            }
            if (errorMessage) break
        }

        if (errorMessage) {
            getParrent(inputElement, option.formGroup).classList.add(option.errorMessageClass)
            errorElement.innerHTML = errorMessage
        } else {
            getParrent(inputElement, option.formGroup).classList.remove(option.errorMessageClass)
            errorElement.innerHTML = ''
        }
        return !errorMessage
    }

    // lấy ra từng element của form
    const formElement = document.querySelector(option.form)
    if (formElement) {
        // xử lý khi submit
        formElement.onsubmit = function(e) {
            e.preventDefault()

            var isFormValid = true

            // lặp qua từng rule và validate
            option.rules.forEach(rule => {
                const inputElements = formElement.querySelectorAll(rule.selector)
                Array.from(inputElements).forEach(function(inputElement) {
                    var isValid = validate(rule,inputElement)
                    if (!isValid) {
                        isFormValid = false
                    }
                })
            })
            let enableInput = formElement.querySelectorAll('[name]:not([disable])')
            let formValue = Array.from(enableInput).reduce(function(values,input) {
                switch(input.type) {
                    case 'radio':
                    case 'checkbox':
                        if(input.matches(':checked')){     
                            if(!Array.isArray(values[input.name])){
                                values[input.name] = [];
                            }
                            values[input.name].push(input.value);
                        }
                        if(!input.matches(':checked') && !values[input.name]){
                            values[input.name] = '';
                        }
                        break;
                    case 'file':
                        values[input.name] = input.files
                        break
                    default:
                        values[input.name] = input.value
                }
                    
                return values
            },{})
            
            if (isFormValid === true) {
                // trường hợp submit với JS
                if (typeof option.onSubmit === 'function') {
                    option.onSubmit(formValue)
                } else { // trường hợp submit mặc định
                    formElement.submit()
                }
            }
        }

        // Xử lý lặp qua mỗi rule và xử lý
        option.rules.forEach(rule => {
            // lưu lại tất cả rule vào object selectorRules
            if (Array.isArray( selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test)
            } else {
                selectorRules[rule.selector] = [rule.test]
            }

            // thực hiện hành động khi người dùng thao tác nhập
            const inputElements = formElement.querySelectorAll(rule.selector)
            Array.from(inputElements).forEach(function(inputElement) {
                if (inputElement) {
                    inputElement.onblur = function() {
                        validate(rule,inputElement)
                    }
    
                    // bỏ lỗi khi người dùng nhập
                    inputElement.oninput = function() {
                        const errorElement = getParrent(inputElement, option.formGroup).querySelector(option.errorMessage)
                        getParrent(inputElement, option.formGroup).classList.remove(option.errorMessageClass)
                        errorElement.innerHTML = ''
                    }
                }
            }) 
        });
    }
}


// Nguyên tắc của rule: nếu người dùng nhập lỗi sẽ trả ra lỗi, nếu đúng sẽ trả về undefined
Validator.isEmail = function(selector, message) {
    return {
        selector: selector,
        test: function(value) {
            const reget = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
            return reget.test(String(value).toLowerCase()) ? undefined : message || "Giá trị nhập vào không chính xác";
        }
    }
}

Validator.minLength = function(selector,min, message) {
    return {
        selector: selector,
        test: function(value) {
            return value.length >= min ? undefined : message || `Vui lòng nhập tối thiểu ${min} kí tự`
        }
    }
}

Validator.isConfirm = function(selector, getConfirmValue, message) {
    return {
        selector: selector,
        test: function(value) {
            return value === getConfirmValue() ? undefined : message || "Giá trị nhập vào không chính xác"
        }
    }
}

Validator.isRequired = function(selector, message) {
    return {
        selector: selector,
        test: function(value) {
            if (typeof value === 'string') {
                return value.trim() ? undefined : message || "Giá trị nhập vào không chính xác"
            }
            return value ? undefined : message || "Giá trị nhập vào không chính xác"
        }
    }
}
