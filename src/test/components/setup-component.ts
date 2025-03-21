import { BaseComponent } from "@/core/component/baseComponent.ts";
import { ZodiacComponent } from "@/core/component/zodiacComponent.ts";
import { Injectable } from "@/core/injection/injectable.ts";
import { Render } from "@/core/render/vdom.ts";
import { Route } from "@/core/routing/route.ts";
import { HSStepper } from "preline";

interface FormState {
  email: string;
  password: string;
  fullName: string;
  company: string;
}

@ZodiacComponent("setup-component")
@Injectable()
@Route("/setup")
export class SetupComponent extends BaseComponent {
  private formState: FormState = {
    email: "",
    password: "",
    fullName: "",
    company: "",
  };

  private stepper: HSStepper | null = null;

  constructor() {
    super(false);
  }

  async connectedCallback() {
    await super.connectedCallback();
    await this.render();
    await window.HSStaticMethods.autoInit();
    await this.initializeStepper();
  }

  async disconnectedCallback() {
    if (this.stepper) {
      (this.stepper as any).element.destroy();
    }
    await super.disconnectedCallback();
  }

  private async initializeStepper() {
    const stepperElement = this.root.querySelector("#hs-stepper-to-destroy") as HTMLElement;
    if (!stepperElement) return;

    this.stepper = new HSStepper(stepperElement);

    this.stepper.on("beforeNext", (index: number) => {
      const isValid = this.validateStep(index);
      if (!isValid) {
        this.stepper?.setErrorNavItem(index);
      }
      return isValid;
    });

    this.stepper.on("next", () => this.render());
    this.stepper.on("back", () => this.render());
  }

  private validateStep(index: number): boolean {
    switch (index) {
      case 1:
        return Boolean(this.formState.email && this.formState.password);
      case 2:
        return Boolean(this.formState.fullName && this.formState.company);
      default:
        return true;
    }
  }

  // @ts-ignore
  private handleInput(field: keyof FormState, value: string) {
    this.formState[field] = value;
    this.render();
  }

  private configureProfile(): string {
    return /* html */ `
      <div class="px-4 py-5 sm:px-6 lg:px-8 mx-auto">
        <div class="bg-white rounded-xl shadow-xs p-4 sm:p-7 dark:bg-neutral-800">
          <div class="mb-8">
            <h2 class="text-xl font-bold text-gray-800 dark:text-neutral-200">
              Profile
            </h2>
            <p class="text-sm text-gray-600 dark:text-neutral-400">
              Manage your name, password and account settings.
            </p>
          </div>

          <form>
            <div class="grid sm:grid-cols-12 gap-2 sm:gap-6">
              <div class="sm:col-span-3">
                <label class="inline-block text-sm text-gray-800 mt-2.5 dark:text-neutral-200">
                  Profile photo
                </label>
              </div>

              <div class="sm:col-span-9">
                <div class="flex items-center gap-5">
                  <img class="inline-block size-16 rounded-full ring-2 ring-white dark:ring-neutral-900" src="https://preline.co/assets/img/160x160/img1.jpg" alt="Avatar">
                  <div class="flex gap-x-2">
                    <div>
                      <button type="button" class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-50 dark:bg-transparent dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800">
                        <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                        Upload photo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="sm:col-span-3">
                <label for="af-account-full-name" class="inline-block text-sm text-gray-800 mt-2.5 dark:text-neutral-200">
                  Full name
                </label>
                <div class="hs-tooltip inline-block">
                  <svg class="hs-tooltip-toggle ms-1 inline-block size-3 text-gray-400 dark:text-neutral-600" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                  </svg>
                  <span class="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible w-40 text-center z-10 py-1 px-2 bg-gray-900 text-xs font-medium text-white rounded-md shadow-2xs dark:bg-neutral-700" role="tooltip">
                    Full name will not be displayed.
                  </span>
                </div>
              </div>

              <div class="sm:col-span-9">
                <div class="sm:flex">
                  <input id="af-account-full-name" type="text" class="py-1.5 sm:py-2 px-3 pe-11 block w-full border-gray-200 shadow-2xs -mt-px -ms-px first:rounded-t-lg last:rounded-b-lg sm:first:rounded-s-lg sm:mt-0 sm:first:ms-0 sm:first:rounded-se-none sm:last:rounded-es-none sm:last:rounded-e-lg sm:text-sm relative focus:z-10 focus:border-blue-500 focus:ring-blue-500 checked:border-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" placeholder="JJ">
                  <input type="text" class="py-1.5 sm:py-2 px-3 pe-11 block w-full border-gray-200 shadow-2xs -mt-px -ms-px first:rounded-t-lg last:rounded-b-lg sm:first:rounded-s-lg sm:mt-0 sm:first:ms-0 sm:first:rounded-se-none sm:last:rounded-es-none sm:last:rounded-e-lg sm:text-sm relative focus:z-10 focus:border-blue-500 focus:ring-blue-500 checked:border-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" placeholder="Development">
                </div>
              </div>

              <div class="sm:col-span-3">
                <label for="af-account-full-name" class="inline-block text-sm text-gray-800 mt-2.5 dark:text-neutral-200">
                  Username
                </label>
                <div class="hs-tooltip inline-block">
                  <svg class="hs-tooltip-toggle ms-1 inline-block size-3 text-gray-400 dark:text-neutral-600" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                  </svg>
                  <span class="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible w-40 text-center z-10 py-1 px-2 bg-gray-900 text-xs font-medium text-white rounded-md shadow-2xs dark:bg-neutral-700" role="tooltip">
                    Full name will not be displayed.
                  </span>
                </div>
              </div>

              <div class="sm:col-span-9">
                <div class="sm:flex">
                  <input id="af-account-username" type="text" class="py-1.5 sm:py-2 px-3 pe-11 block w-full border-gray-200 shadow-2xs -mt-px -ms-px first:rounded-t-lg last:rounded-b-lg sm:first:rounded-s-lg sm:mt-0 sm:first:ms-0 sm:first:rounded-se-none sm:last:rounded-es-none sm:last:rounded-e-lg sm:text-sm relative focus:z-10 focus:border-blue-500 focus:ring-blue-500 checked:border-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" placeholder="jj_development">
                </div>
              </div>

              <div class="sm:col-span-3">
                <label for="af-account-email" class="inline-block text-sm text-gray-800 mt-2.5 dark:text-neutral-200">
                  Email
                </label>
              </div>

              <div class="sm:col-span-9">
                <input id="af-account-email" type="email" class="py-1.5 sm:py-2 px-3 pe-11 block w-full border-gray-200 shadow-2xs sm:text-sm rounded-lg focus:border-blue-500 focus:ring-blue-500 checked:border-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" placeholder="contact@joordih.dev">
              </div>

              <div class="sm:col-span-3">
                <label for="af-account-password" class="inline-block text-sm text-gray-800 mt-2.5 dark:text-neutral-200">
                  Password
                </label>
              </div>

              <div class="sm:col-span-9">
                <div class="space-y-2">
                  <input id="af-account-password" type="text" class="py-1.5 sm:py-2 px-3 pe-11 block w-full border-gray-200 shadow-2xs rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 checked:border-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" placeholder="Enter password">
                  <input type="text" class="py-1.5 sm:py-2 px-3 pe-11 block w-full border-gray-200 shadow-2xs rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 checked:border-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" placeholder="Enter password again">
                </div>
              </div>

              <div class="sm:col-span-3">
                <label for="af-account-bio" class="inline-block text-sm text-gray-800 mt-2.5 dark:text-neutral-200">
                  Description
                </label>
              </div>

              <div class="sm:col-span-9">
                <textarea id="af-account-bio" class="py-1.5 resize-none sm:py-2 px-3 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 checked:border-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" rows="6" placeholder="Type your message..."></textarea>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private configurePlans() {
    return /* html */ `
      <div class="grid grid-cols-6 grid-rows-5 gap-6 m-1.5 w-screen">
        <div class="col-start-1 row-start-1 col-span-2 row-span-5 bg-neutral-700 p-[6px] rounded-[6px] w-80 h-full">
          <div id="hs-destroy-and-reinitialize-wrapper-for-copy" class="space-y-3">
            <div id="hs-destroy-and-reinitialize-content-for-copy">
              <div class="relative">
                <input type="text" class="py-2.5 sm:py-3 ps-4 pe-8 block w-full border-gray-200 rounded-[5px] sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" placeholder="Enter Name">
                <span class="inline-flex absolute top-[15px] end-2.5 text-red-400 cursor-pointer" data-hs-copy-markup-delete-item="">
                  <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="m15 9-6 6"></path>
                    <path d="m9 9 6 6"></path>
                  </svg>
                </span>
              </div>
            </div>
          </div>
          <div class="col-start-1 row-start-5 col-span-2 row-span-1 p-[6px] mb-auto">
            <button id="hs-copy-markup-to-destroy" type="button" data-hs-copy-markup='{
              "targetSelector": "#hs-destroy-and-reinitialize-content-for-copy",
              "wrapperSelector": "#hs-destroy-and-reinitialize-wrapper-for-copy",
              "limit": 3
            }' class="h-[2rem] w-full py-1.5 px-2 rounded-[5px] inline-flex items-center gap-x-1 text-xs font-medium border border-dashed border-gray-200 bg-white text-gray-800 hover:bg-neutral-600 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:focus:bg-neutral-700">
              <svg class="shrink-0 size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              Add Name
            </button>
          </div>
        </div>
        <div class="col-start-3 col-span-4 row-span-5 bg-neutral-700 p-6 grid grid-rows-5 gap-4 w-full">
          <div class="row-start-1 row-span-1 text-white text-lg font-bold">
            Form title
          </div>

          <div class="row-start-2 row-span-4 grid grid-cols-2 gap-6">
            <div class="bg-neutral-800 p-4 rounded-lg text-white">
              Form col 1
            </div>

            <div class="bg-neutral-800 p-4 rounded-lg text-white">
              Form col 2
            </div>
          </div>
        </div>
      </div>
    </div>
    `;
  }

  @Render()
  render() {
    return (this.root.innerHTML = /* html */ `
      <div class="flex flex-col justify-center min-h-screen p-10 bg-neutral-900">
        <div data-hs-stepper>
          <div class="relative flex flex-row gap-x-1">
            <div class="flex items-center gap-x-2 shrink basis-0 flex-1 group" data-hs-stepper-nav-item='{ "index": 1 }'>
              <span class="min-w-7 min-h-7 group inline-flex items-center text-xs align-middle">
                <span class="size-7 flex justify-center items-center shrink-0 bg-gray-100 font-medium text-gray-800 rounded-full group-focus:bg-gray-200 hs-stepper-active:bg-blue-600 hs-stepper-active:text-white hs-stepper-success:bg-blue-600 hs-stepper-success:text-white hs-stepper-completed:bg-teal-500 hs-stepper-completed:group-focus:bg-teal-600 dark:bg-neutral-700 dark:text-white dark:group-focus:bg-gray-600 dark:hs-stepper-active:bg-blue-500 dark:hs-stepper-success:bg-blue-500 dark:hs-stepper-completed:bg-teal-500 dark:hs-stepper-completed:group-focus:bg-teal-600">
                  <span class="hs-stepper-success:hidden hs-stepper-completed:hidden">1</span>
                  <svg class="hidden shrink-0 size-3 hs-stepper-success:block" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
                <span class="ms-2 text-sm font-medium text-gray-800 dark:text-neutral-200">
                  Configure profile
                </span>
              </span>
              <div class="w-full h-px flex-1 bg-gray-200 group-last:hidden hs-stepper-success:bg-blue-600 hs-stepper-completed:bg-teal-600 dark:bg-neutral-700 dark:hs-stepper-success:bg-blue-600 dark:hs-stepper-completed:bg-teal-600"></div>
            </div>
        
            <div class="flex items-center gap-x-2 shrink basis-0 flex-1 group" data-hs-stepper-nav-item='{ "index": 2 }'>
              <span class="min-w-7 min-h-7 group inline-flex items-center text-xs align-middle">
                <span class="size-7 flex justify-center items-center shrink-0 bg-gray-100 font-medium text-gray-800 rounded-full group-focus:bg-gray-200 hs-stepper-active:bg-blue-600 hs-stepper-active:text-white hs-stepper-success:bg-blue-600 hs-stepper-success:text-white hs-stepper-completed:bg-teal-500 hs-stepper-completed:group-focus:bg-teal-600 dark:bg-neutral-700 dark:text-white dark:group-focus:bg-gray-600 dark:hs-stepper-active:bg-blue-500 dark:hs-stepper-success:bg-blue-500 dark:hs-stepper-completed:bg-teal-500 dark:hs-stepper-completed:group-focus:bg-teal-600">
                  <span class="hs-stepper-success:hidden hs-stepper-completed:hidden">2</span>
                  <svg class="hidden shrink-0 size-3 hs-stepper-success:block" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
                <span class="ms-2 text-sm font-medium text-gray-800 dark:text-neutral-200">
                  Configure plans
                </span>
              </span>
              <div class="w-full h-px flex-1 bg-gray-200 group-last:hidden hs-stepper-success:bg-blue-600 hs-stepper-completed:bg-teal-600 dark:bg-neutral-700 dark:hs-stepper-success:bg-blue-600 dark:hs-stepper-completed:bg-teal-600"></div>
            </div>
        
            <div class="flex items-center gap-x-2 shrink basis-0 flex-1 group" data-hs-stepper-nav-item='{ "index": 3 }'>
              <span class="min-w-7 min-h-7 group inline-flex items-center text-xs align-middle">
                <span class="size-7 flex justify-center items-center shrink-0 bg-gray-100 font-medium text-gray-800 rounded-full group-focus:bg-gray-200 hs-stepper-active:bg-blue-600 hs-stepper-active:text-white hs-stepper-success:bg-blue-600 hs-stepper-success:text-white hs-stepper-completed:bg-teal-500 hs-stepper-completed:group-focus:bg-teal-600 dark:bg-neutral-700 dark:text-white dark:group-focus:bg-gray-600 dark:hs-stepper-active:bg-blue-500 dark:hs-stepper-success:bg-blue-500 dark:hs-stepper-completed:bg-teal-500 dark:hs-stepper-completed:group-focus:bg-teal-600">
                  <span class="hs-stepper-success:hidden hs-stepper-completed:hidden">3</span>
                  <svg class="hidden shrink-0 size-3 hs-stepper-success:block" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
                <span class="ms-2 text-sm font-medium text-gray-800 dark:text-neutral-200">
                  Step
                </span>
              </span>
              <div class="w-full h-px flex-1 bg-gray-200 group-last:hidden hs-stepper-success:bg-blue-600 hs-stepper-completed:bg-teal-600 dark:bg-neutral-700 dark:hs-stepper-success:bg-blue-600 dark:hs-stepper-completed:bg-teal-600"></div>
            </div>
          </div>
        
          <div class="mt-5 sm:mt-8">
            <div data-hs-stepper-content-item='{ "index": 1 }'>
              <div class="h-170 overflow-y-auto bg-gray-50 flex border border-dashed border-gray-200 rounded-xl dark:bg-neutral-800 dark:border-neutral-700">
                ${this.configureProfile()}
              </div>
            </div>
            <div data-hs-stepper-content-item='{ "index": 2 }' style="display: none;">
              <div class="h-170 overflow-y-auto bg-gray-50 flex border border-dashed border-gray-200 rounded-xl dark:bg-neutral-800 dark:border-neutral-700">
                ${this.configurePlans()}
              </div>
            </div>
            <div data-hs-stepper-content-item='{ "index": 3 }' style="display: none;">
              <div class="p-4 h-48 bg-gray-50 flex justify-center items-center border border-dashed border-gray-200 rounded-xl dark:bg-neutral-800 dark:border-neutral-700">
                <h3 class="text-gray-500 dark:text-neutral-500">
                  Third content
                </h3>
              </div>
            </div>
        
            <div data-hs-stepper-content-item='{ "isFinal": true }' style="display: none;">
              <div class="p-4 h-48 bg-gray-50 flex justify-center items-center border border-dashed border-gray-200 rounded-xl dark:bg-neutral-800 dark:border-neutral-700">
                <h3 class="text-gray-500 dark:text-neutral-500">
                  Final content
                </h3>
              </div>
            </div>
            <div class="mt-5 flex justify-between items-center gap-x-2">
              <button type="button" class="py-2 px-3 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700" data-hs-stepper-back-btn="">
                <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
                Back
              </button>
              <button type="button" class="py-2 px-3 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none" data-hs-stepper-next-btn>
                Next
                <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </button>
              <button type="button" class="py-2 px-3 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none" data-hs-stepper-finish-btn="" style="display: none;">
                Finish
              </button>
              <button type="reset" class="py-2 px-3 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none" data-hs-stepper-reset-btn="" style="display: none;">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    `);
  }
}
