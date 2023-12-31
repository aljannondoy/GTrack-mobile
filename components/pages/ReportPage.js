import React, { useEffect, useState, useRef } from 'react'
import {
    Image,
    Badge,
    Button,
    Center,
    Text,
    Input,
    ScrollView,
    Select,
    Icon,
    CheckIcon,
    TextArea,
    Stack,
    Box,
    Link,
    HStack
  } from "native-base";
import { MaterialIcons } from "@expo/vector-icons"
import axios from 'axios';
import { useFormik } from 'formik';
import envs from '../../config/env.js'
import AsyncStorage from '@react-native-async-storage/async-storage';
import MessageAlert from '../helpers/MessageAlert';
import PickImage from '../helpers/PickImage.js';
import { uuidGenerator } from '../helpers/uuidGenerator.js';
import Firebase from '../helpers/Firebase.js';
import * as yup from 'yup'

const database=Firebase.database();
const ReportPage = ({navigation,route}) => {
    const [loading,setLoading]=useState(false);
    const messageRef=useRef();
    const [initialValues, setInitialValues] = useState(null);
    const [user,setUser]=useState(null);
    const [path,setPath]=useState(null);
    const [images,setImages]=useState([]);
    const [alert,setAlert]=useState({
        visible:false,
        message:null,
        colorScheme:null,
        header:null
    });
    const reportValidationSchema = yup.object().shape({
        subject: yup
          .string()
          .required('Subject is required'),
        message: yup
          .string()
          .required('Message is required'),
        classification: yup
          .string()
          .required('Classification is required'),
        images: yup
          .array()
          .min(1,"Attach atleast 1 image")
          .required('Attach atleast 1 image'),
    })
    const getData = async () => {
        try {
            const value = await AsyncStorage.getItem('@user');
            if(value!==null){
                setUser(JSON.parse(value));
            }else{
                setUser(null);
            }
        }catch (e){
            console.log(e);
        }
    }
    useEffect(() => {
        getData();
        setPath(`/gtrack-mobile/concern/${uuidGenerator()}`);
    }, []);
    useEffect(() => {
      if(user){
        setInitialValues({
          email:user.email?user.email:"",
          subject:"",
          message:"",
          classification:"",
          images:[]
        })
      };
    }, [user]);
    const setFirebaseConcern=async (concern)=>{
        await database.ref(`/Concerns/${concern.concern_id}`)
        .set({
            sender: `${user.fname} ${user.lname}`,
            sender_image:user.image,
            concern_id: concern.concern_id,
            subject: concern.subject,
            message: concern.message,
            classification: concern.classification,
            active: 1
        })
    }
    const handleRemoveImage=(index)=>{
        let imgTemp=[];
        imgTemp=images;
        imgTemp.splice(index,1); 
        setImages([...imgTemp]);
        setFieldValue("images",[...imgTemp]);
    }
    
    useEffect(() => {
        if(route.params&&route.params.photos){
            setImages(route.params.photos);
            setFieldValue("images",route.params.photos);
            delete route.params.photos;
        }
        return ()=>{
            setImages([]);
            setFieldValue("images",[]);
        }
    }, [route.params]);
    const handleFormSubmit = async (values,{resetForm}) =>{
        setLoading(true);
        axios.post(`${envs.BACKEND_URL}/mobile/concern/send`,{email:values.email,subject:values.subject,message:values.message,classification:values.classification,images:images})
        .then(res => {
            setLoading(false);
            if(res.data.success){
                resetForm();
                setImages([]);
                setFirebaseConcern(res.data.data);
                setAlert({visible:true,message:res.data.message,colorScheme:"success",header:"Success"});
            }else{
                setAlert({visible:true,message:res.data.message,colorScheme:"danger",header:"Error"})
            }
        })
    }
    const { handleChange, handleSubmit,handleBlur, values, errors, isValid, touched, setFieldValue } = useFormik({
        initialValues:initialValues,
        enableReinitialize:true,
        validationSchema:reportValidationSchema,
        onSubmit: handleFormSubmit
    });
    return (
        <ScrollView>
        <MessageAlert alert={alert} setAlert={setAlert}/>
        <Center
            px={5}
            mt={10}
        >
            <Stack space={3} style={{alignSelf:'stretch'}}>
                {(errors.subject && touched.subject) &&
                    <Text style={{ fontSize: 10, color: 'red' }}>{errors.subject}</Text>
                }
                <Input 
                    size="md" 
                    placeholder="Subject"
                    returnKeyType="next" 
                    blurOnSubmit={false}
                    onSubmitEditing={() => messageRef.current.focus()} 
                    autoCapitalize="sentences"
                    bg={'white'}
                    onBlur={handleBlur('subject')}
                    value={values&&values.subject?values.subject:""} onChangeText={handleChange('subject')}
                />
                {(errors.message && touched.message) &&
                    <Text style={{ fontSize: 10, color: 'red' }}>{errors.message}</Text>
                }
                <TextArea
                    h={200}
                    bgColor={'white'}
                    autoCapitalize="sentences"
                    placeholder="Write description here ..."
                    style={{
                      textAlignVertical:'top',
                      fontSize:14,
                    }}
                    onBlur={handleBlur('message')}
                    ref={messageRef}
                    p={3}
                    value={values&&values.message?values.message:""} onChangeText={handleChange('message')}
                />
                {(errors.images && touched.images) &&
                    <Text style={{ fontSize: 10, color: 'red' }}>{errors.images}</Text>
                }
                <PickImage navigation={navigation} fromPage={'Concern'} path={path} value={images} setValue={setImages} multiple={true} setFieldValue={setFieldValue}/>
                
                <Center >
                    <HStack space={3}>
                    {images.map((img,i)=>{
                        return  (
                            <Box rounded={'full'} key={img}>
                                <Image
                                    size="md"
                                    source={{uri:img}}
                                    alt="Concern Photo"
                                />
                                <Link onPress={()=>{handleRemoveImage(i)}} style={{position:'absolute',right:0,marginRight:-10,top:0,marginTop:-5}}>
                                    <Badge colorScheme="danger" rounded={'full'}>X</Badge>
                                </Link>
                            </Box>
                        );
                    })
                    }
                    </HStack>
                </Center>
                {(errors.classification && touched.classification) &&
                    <Text style={{ fontSize: 10, color: 'red' }}>{errors.classification}</Text>
                }
                <Select
                    accessibilityLabel="Choose concern classification"
                    placeholder="Choose concern classification"
                    _selectedItem={{
                        bg: "success.500",
                        endIcon: <CheckIcon size="5" />,
                    }}
                    selectedValue={values&&values.classification?values.classification:""}
                    dropdownIcon={
                        <Icon
                        as={<MaterialIcons name="unfold-more" />}
                        color={'#10b981'}
                        size={7}
                        />
                    }
                    style={{
                        borderWidth: 1,
                        borderColor: '#10b981'
                    }}
                    onValueChange={handleChange('classification')}
                >
                    <Select.Item label="Violation" value="Violation" />
                    <Select.Item label="Delay" value="Delay" />
                    <Select.Item label="Pile-up" value="Pile-up" />
                    <Select.Item label="General Concern" value="General Concern" />
                    <Select.Item label="Request" value="Request" />
                    <Select.Item label="Others" value="Others" />
                </Select>
            </Stack>
            <Button colorScheme='danger' mt={10} mb={2}
                isLoading={loading}
                isLoadingText="Sending"
                leftIcon={
                    <Icon
                        as={<MaterialIcons name="send" />}
                        color={'white'}
                        size={5}
                    />
                }
                onPress={handleSubmit}
                disabled={!isValid}
            >
                Send Concern
            </Button>
        </Center>
        </ScrollView>
    )
}
export default ReportPage
