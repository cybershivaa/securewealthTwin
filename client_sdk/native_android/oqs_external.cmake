# ExternalProject script to fetch and build liboqs as part of the native Android build
include(ExternalProject)

set(OQS_GIT_URL "https://github.com/open-quantum-safe/liboqs.git")
set(OQS_GIT_TAG "main")
set(OQS_SRC_DIR "${CMAKE_BINARY_DIR}/liboqs-src")
set(OQS_BUILD_DIR "${CMAKE_BINARY_DIR}/liboqs-build")

ExternalProject_Add(liboqs
  GIT_REPOSITORY ${OQS_GIT_URL}
  GIT_TAG ${OQS_GIT_TAG}
  PREFIX ${CMAKE_BINARY_DIR}/liboqs
  SOURCE_DIR ${OQS_SRC_DIR}
  BINARY_DIR ${OQS_BUILD_DIR}
  CMAKE_ARGS -DBUILD_SHARED_LIBS=OFF -DCMAKE_POSITION_INDEPENDENT_CODE=ON -DCMAKE_INSTALL_PREFIX=${CMAKE_BINARY_DIR}/liboqs-install
  BUILD_BYPRODUCTS ${CMAKE_BINARY_DIR}/liboqs-install/lib/liboqs.a
)

# Provide imported target for linking
add_library(oqs_static STATIC IMPORTED)
set_target_properties(oqs_static PROPERTIES IMPORTED_LOCATION ${CMAKE_BINARY_DIR}/liboqs-install/lib/liboqs.a)
add_dependencies(oqs_static liboqs)
