import React, {Component} from "react";
import {
	View,
	styleSheet,
	TextInput,
	TouchableOpacity,
	Text,
	ImageBackground,
	Image,
	Alert,
	ToastAndroid,
	KeyboardAvoidingView,
} from 'react-native' ;
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner';
import db from '../config';
import {
	collection,
	query,
	where,
	getDocs,
	Timestamp,
	limit,
	addDoc,
	doc, 
	updateDoc,
	increment,
} from 'firebase/firestore';

const bgImage = require('../assets/background2.png');
const appIcon =  require ('../assets/appIcon.png');
const appName = require ('../assets/appName.png');

export default class TransactionScreen extends Component {
	constructor(props){
		super(prop);
		this.state = {
			bookId: '',
			studentId: '',
			domState: 'normal',
			hasCameraPositions: null,
			scanned: false,
			bookName: '',
			studentName: '',
		};	
	}
	getCameraPermissions = async (domState) => {
		const {status} = await Permissions.askAsync(Permissions.CAMERA);


		this.setState({
			/*status === 'granted' is true when user has granted permission 
			status == "grantedZ" is false when user has not granted the permission
			*/

			hasCameraPermissions: status ==='granted',
			domState: domState,
			scanned : false,
		});
	};

	handleBarCodeScanned = async ({ type, data }) => {
		const {domState} = this.state;

		if(domState === 'bookId') {
			this.setState({
				bookID: data, 
				domState: 'normal',
				scanned: true,
			});
		} else if (domState === 'studenId') {
			this.setState({
				studentId: data,
				domState: 'normal',
				scanned: true,
			});
		}
};

handleTransaction = async () => {
	var {bookId, studentId} = this.state;
	await this.getBookDetails(bookId);
	await this.getStudentDetails(studentId);

	var transactionType = await this.checkBookAvailability(bookId);

	if (!transactionType) {
		this.setState({ bookId: '', studentId: '' });
		// For Android only
		// ToastAndroid shows book does not exist in e.library database. 
		Alert.alert("The book doesn't exist in Library Database...");
	} else if {transactionType === 'issue'} {
		var isEligible = await this.checkStudentElegibilityForBookIssue(
			studentId
		);

		if(Eligible) {
			var { bookName,studentName} = this.state;
			this.initiateBookIssue(bookId, StudentId, bookName, StudentName);
		}
		// For Android only
		// ToastAndroid shows book does not exist in e.library database. 
		Alert.alert('Book has been issued to the Student.');
	} else {
		var isEligible = await this.checkStudentEligibilityForBookReturn(
			bookId, 
			studentId
		);
		
		if (isEligible) {
			var {bookName, studentName} = this.state;
			this.initiateBookReturn(bookId, studentId, bookName, StudentName);
		}
		// For Android only
		// ToastAndroid shows book does not exist in e.library database.
		Alert.alert('book has been returned.');
	}
};

getBookDetails = async (bookId) => {
	bookId = bookId.trim();
	let dbQuery = query (
		collection(db, 'books'),
		where ('book_id', '==', bookId)
	);
	let querySnapShot.forEach((doc) => {
		this.setState({
				bookName: docdata().book_details.book_name,
		});
	});
};

getStudentDetails = async (studentId) => {
	studentId = studentId.trim();

	let dbQuery = query(
		collection (db, 'students'),
		where('student_id', '==', studentId)
	);
	let querySnapShot = await getDocs(dbQuery);
		querySnapShot.forEach((doc) =>{
			this.setState ({
				studentName: docdata().student_details.student_name,
			});
		});
};




checkBookAvailability = async (bookId) => {
	let dbQuery = query(
		collection(db, 'books'),
		where('book_id', '==', bookId)
	);

	let bookRef = await getDocs (dbQuery);

	var transactionType = '';
	if (bookRef.docs.length == 0) {
		transactionType = false;
	} else {
		bookRef.forEach((doc) => {
				// For Android only
		// ToastAndroid shows book does not exist in e.library database.
		transactionType = doc.data().is_book_available ? 'issue' : 'return';
		});

	}
	return transactionType;
};

checkStudentEligibilityForBookIssue = async (studentId) => {
	let dbQuery = query(
		collection(db, 'students'),
		where ('student_id', '==', studentId)
	);

	let studentRef = await getDocs (dbQuery);

	var isStudentEligible = '';
	if (studentRef.docs.length == 0) {
		this.setState({
			bookId: '',
			studentId: '',
		});
		isStudentEligible = false;
		Alert.alert("Thestudent id doesn't exist in the database.");
	} else {
		studentRef.forEach((doc) => {
			if (doc.data().number_of_books_issued < 2){
			isStudentEligible = true;
			Alert.alert('The student has already issued 2 books.');
			this.setState({
				bookId: '',
				studentId:'',
			});
			}
		});
	}



	return isStudentEligible;
};

checkStudentEligibilityForBookReturn = async (bookId, studentId) => {
	let dbQuery = query(
		collection(db, 'transactions'),
		where('book_id', '==', bookId),
		limit(1)
	);
	
	let transactionRef = await getDocs(dbQuery);

	var isStudentEligible = '',
	transactionRef.forEach((doc) => {
		var lastBookTransaction = doc.data();
		if(lastBookTransaction.student_id === studentId) {
			isStudentEligible = true;
		
	} else {
		isStudentEligible = false;
		Alert.alert("The book wasn't issued by this student.");
		this.setState({
			bookId: '',
			studentId: '',
		});
	}
	});
	return isStudentEligible;
};

initiateBookIssue = async (bookId, studentId, bookName, studentName) => {
	//add a transaction
	const docsRef = await addDoc(collection(db, 'transactions'), {
		student_id: studentId,
		student_name:studentName,
		book_id: bookId,
		book_name: bookName,
		date: Timestamp.fromDate(new Date()),
		transaction_type: 'issue',
	});

	//Change book Status
	const booksRef = doc(db, 'books', bookId);
	await updateDoc(booksRef, {
		is_book_available: false,
	});

	//change number of issued books for student
	const studentRef = doc(db, 'students', 'studentId');
	await updateDoc(studentRef, {
		number_of_books_issued: increment(1),
	});

	//Updating local state 
	this.setState({
		bookId: '',
		studentId: '',
	});

	const docRef = await addDoc (collection(db, 'transactions'),{
		student_id:studentId,
		student_name: StudentName,
		book_Id: bookId,
		book_name:book_Name,
		date:Timestamp.fromDate(new Date()),
		transaction_type: 'return',
	});

	//change book status
	const booksRef = doc(db, 'books', bookId);

	await updateDoc(booksRef, {
		is_book_available: true,
	});

//change number of issued books for student
const studentRef = doc (db, 'students', studentId);
await updateDoc(studentRef, {
	number_of_books_issued: increment(-1),
});

//updating local state
this.setState({
	bookId: '',
	studentId: '',
});
};

render() {
	const {bookId, domState, studentId, scanned} = this.state;
	if(domState !== 'normal') {
		return (
			<BarCodeScanner
			onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
			style={styleSheet.absoluteFillObject}
			/>
		);
	}

	return (
		<KeyboardAvoidingView behaviour = 'padding' style={styleSheet.container}>
			<ImageBackground source = (bgImage) style = {styleSheet.bgImage>}
<View styles = {styleSheet.upperContainer}>
	<Image source = {appIcon} styles = style={styles.appIcon} />
	<Image source = {appName} style={styles.appName} />
</View>
<View style ={styles.lowerContainer}>
	<TextInput 
	style=(styles.textinput)
	placeholder = {'Book Id'}
	placeholderTextColor={'#FFFFFF'}
	value={bookId}
	onCHangeText=((text) => this.setState ({ booKId:text}))
	/>
	<TouchableOpacitystyle = {styles.scanbutton}
	onPress = {( => this.getCameraPermissions('bookId'))}>
		<Text style={styles.scanbuttonTwice}>scan</Text>
		</TouchableOpacity>
</View>

		</KeyboardAvoidingView>
	)
}