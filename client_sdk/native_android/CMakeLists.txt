cmake_minimum_required(VERSION 3.10)
project(secure_quantum_crypto)

# This CMake file is a template. Replace with paths to your PQ library sources
# and compile settings for Android ABIs (armeabi-v7a, arm64-v8a, x86_64).
include(${CMAKE_SOURCE_DIR}/oqs_external.cmake)

add_library(securequantum SHARED
    jni/securequantum_jni.cpp
    jni/oqs_wrapper.c
)

# Expose include dir for current module
target_include_directories(securequantum PUBLIC ${CMAKE_SOURCE_DIR}/jni)

# Link against the built liboqs static library
target_link_libraries(securequantum PUBLIC oqs_static)
