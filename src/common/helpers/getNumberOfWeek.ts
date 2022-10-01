export const getNumberOfWeek = ()=>{
    
    const currentDate = new Date();

    const oneJanuary = new Date(currentDate.getFullYear(),0,1).getMilliseconds();
    const numberOfDays = Math.floor((currentDate.getMilliseconds() - oneJanuary) / (1000 * 60 * 60 * 24))
    const result = Math.ceil((currentDate.getDay() + 1 + numberOfDays) / 7)

    return result;
}