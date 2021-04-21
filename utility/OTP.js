const numbers = [
    123456,
    661234,
    413514,
    890321,
    765890
]


function check(userOtp){
    for(let i = 0; i < numbers.length; i++){
        if(numbers[i] === userOtp){
            return true;
        }
    }

    return -1;
}

function random(){
    const index = Math.floor(Math.random() * numbers.length);

    console.log(numbers[index]);

    return numbers[index];

}



module.exports = {
    check,random
};