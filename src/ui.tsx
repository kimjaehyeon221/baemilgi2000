import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { C, styles } from './styles';
export function Button({label,onPress,secondary=false,danger=false}:{label:string;onPress:()=>void;secondary?:boolean;danger?:boolean}){return <Pressable onPress={onPress} style={({pressed})=>[styles.button,secondary&&styles.buttonSecondary,danger&&styles.buttonDanger,pressed&&{opacity:.78}]} accessibilityRole="button"><Text style={[styles.buttonText,secondary&&styles.buttonSecondaryText,danger&&{color:C.danger}]}>{label}</Text></Pressable>}
export function Header({onInfo}:{onInfo:()=>void}){return <View style={styles.header}><View style={styles.brandLockup}><Text style={styles.brand}>BAEMILGI</Text><Text style={styles.brandMark}>2000</Text></View><Pressable onPress={onInfo} style={styles.circle} accessibilityRole="button" accessibilityLabel="정보 및 설정" hitSlop={8}><Text style={styles.circleText}>INFO</Text></Pressable></View>}
export function FormStep({n,title,body}:{n:string;title:string;body:string}){return <View style={styles.formStep}><Text style={styles.formN}>{n}</Text><View style={{flex:1}}><Text style={styles.formTitle}>{title}</Text><Text style={styles.formBody}>{body}</Text></View></View>}

