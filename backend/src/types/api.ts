export interface ApiErrorShape {
  message: string;
}

export interface ApiSuccessShape<T> {
  data: T;
}

