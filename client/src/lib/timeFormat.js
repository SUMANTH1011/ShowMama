const timeFormat=(minutes)=>{
    const hours=Math.floor(minutes/60)
    const minutesReam=minutes%60
    return `${hours}h ${minutesReam}m`
}
export default timeFormat