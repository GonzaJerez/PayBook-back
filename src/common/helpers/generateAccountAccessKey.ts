import {v4 as uuidv4} from 'uuid'

export const generateAccountAccessKey = () => {
    const uuid = uuidv4()
    const accessKey = uuid.slice(uuid.length - 8)

    return accessKey;
}